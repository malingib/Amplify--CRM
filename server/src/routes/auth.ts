import { Router, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken } from '../lib/auth';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../types/schemas';
import { config } from '../config';
import { sendEmail } from '../lib/googleWorkspace';

const router = Router();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many invites. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});


// POST /api/auth/bootstrap-admin — one-time, allowlisted first administrator setup.
// Requires a deployment secret and refuses to run once any privileged account exists.
const bootstrapLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many setup attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/bootstrap-admin', bootstrapLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
    const allowedEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
    const suppliedToken = typeof req.body?.token === 'string' ? req.body.token : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!expectedToken || !allowedEmail) {
      res.status(404).json({ error: 'Administrator setup is not enabled' });
      return;
    }
    const expected = Buffer.from(expectedToken);
    const supplied = Buffer.from(suppliedToken);
    const tokenValid = expected.length === supplied.length && expected.length > 0 && timingSafeEqual(expected, supplied);
    if (!tokenValid) {
      res.status(401).json({ error: 'Invalid setup authorization' });
      return;
    }
    if (email !== allowedEmail || !name || name.length < 2 || password.length < 12 || password.length > 128) {
      res.status(400).json({ error: 'Use the authorized email, a name, and a password of 12–128 characters' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      // Serialize concurrent bootstrap attempts; only the first privileged account can be created.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(734829104)`;
      const privilegedCount = await tx.user.count({ where: { role: { in: ['ADMIN', 'SYSTEM_OWNER'] } } });
      if (privilegedCount > 0) throw new Error('ADMIN_BOOTSTRAP_ALREADY_USED');
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) throw new Error('ADMIN_BOOTSTRAP_EMAIL_EXISTS');
      return tx.user.create({
        data: { email, name, passwordHash, role: 'ADMIN', status: 'Active' },
        select: { id: true, email: true, name: true, role: true, avatar: true },
      });
    });

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error?.message === 'ADMIN_BOOTSTRAP_ALREADY_USED') {
      res.status(409).json({ error: 'Administrator setup has already been completed' });
      return;
    }
    if (error?.message === 'ADMIN_BOOTSTRAP_EMAIL_EXISTS') {
      res.status(409).json({ error: 'An account already exists for the authorized email; contact support for verified recovery' });
      return;
    }
    console.error('Admin bootstrap error:', error);
    res.status(500).json({ error: 'Administrator setup failed' });
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        // Public self-registration must never grant elevated privileges.
        role: 'VIEWER',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: 'Google credential required' });
      return;
    }

    // Verify token with Google
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const payload: any = await verifyRes.json();

    if (!payload.email) {
      res.status(401).json({ error: 'Invalid Google credential' });
      return;
    }

    // Domain restriction if configured
    const domain = config.google.allowedDomain;
    if (domain && !payload.email.endsWith(`@${domain}`)) {
      res.status(403).json({ error: `Only @${domain} accounts allowed` });
      return;
    }

    // Find existing user (invite-only)
    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      res.status(403).json({ error: 'Access denied — no invite found for this email. Contact an admin.' });
      return;
    }

    // Link googleId on first login via Google
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, avatar: payload.picture || user.avatar },
      });
    }

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      token,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true, status: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/invite — admin provisions a user for Google-only login
router.post('/invite', inviteLimiter, authenticate, authorize('ADMIN', 'SYSTEM_OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'User already exists with this email' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role: role || 'VIEWER',
        passwordHash: '', // no password — Google-only login
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // Send welcome email via Gmail
    const appUrl = config.appUrl;
    const welcomeBody = `
      <h2>Welcome to Amplify CRM</h2>
      <p>Hi ${user.name},</p>
      <p>You've been invited to join <strong>Amplify CRM</strong>.</p>
      <p>Sign in with your Google account at <a href="${appUrl}">${appUrl}</a>.</p>
      <p>Your registered email is: <strong>${user.email}</strong></p>
      <hr>
      <p><em>This is an automated message from Amplify CRM.</em></p>
    `;
    sendEmail({
      to: user.email,
      subject: `Welcome to Amplify CRM — ${user.name}`,
      body: welcomeBody,
    }).catch((err: any) => console.warn('[auth/invite] Welcome email not sent:', err.message));

    res.status(201).json({ user });
  } catch (error: any) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true },
    });
    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
