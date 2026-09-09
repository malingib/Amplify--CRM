import dotenv from 'dotenv';
dotenv.config();

function parseCorsOrigins(raw: string | undefined): string[] {
  try {
    return raw ? JSON.parse(raw) : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];
  } catch {
    return raw!.split(',').map(s => s.trim());
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return 'dev-only-secret-change-this';
}

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  jwt: {
    secret: getJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    allowedDomain: process.env.GOOGLE_ALLOWED_DOMAIN || '',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
    gmailSender: process.env.GMAIL_SENDER || '',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    chatVerificationToken: process.env.GOOGLE_CHAT_VERIFICATION_TOKEN || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  evolution: {
    url: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  },
  mobiwave: {
    apiKey: process.env.MOBIWAVE_API_KEY || '',
    senderId: process.env.MOBIWAVE_SENDER_ID || '',
  },
};
