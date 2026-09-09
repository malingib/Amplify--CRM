import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

async function workspaceId(req: AuthRequest) {
  const id = String(req.headers['x-workspace-id'] || req.query.workspaceId || req.body?.workspaceId || '');
  if (!id || !req.user) return null;
  const rows = await prisma.$queryRawUnsafe<any[]>(
    'SELECT id FROM workspace_members WHERE workspace_id=? AND user_id=? AND status=? LIMIT 1',
    id, req.user.userId, 'active'
  );
  return rows[0] ? id : null;
}

router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const ws = await workspaceId(req);
    if (!ws) return res.status(403).json({ error: 'Workspace access denied' });
    const term = String(req.query.q || '').trim();
    if (term.length < 2) return res.json([]);
    const q = `%${term}%`;
    const [companies, people, opportunities] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        "SELECT id,name,email,domain,'company' AS type FROM companies WHERE workspace_id=? AND (name LIKE ? OR email LIKE ? OR domain LIKE ?) ORDER BY name LIMIT 25",
        ws, q, q, q
      ),
      prisma.$queryRawUnsafe<any[]>(
        "SELECT p.id,p.first_name,p.last_name,p.email,c.name AS company_name,'person' AS type FROM people p LEFT JOIN companies c ON c.id=p.company_id WHERE p.workspace_id=? AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ? OR c.name LIKE ?) ORDER BY p.last_name,p.first_name LIMIT 25",
        ws, q, q, q, q
      ),
      prisma.$queryRawUnsafe<any[]>(
        "SELECT id,name,amount,stage,'opportunity' AS type FROM opportunities WHERE workspace_id=? AND (name LIKE ? OR description LIKE ?) ORDER BY updated_at DESC LIMIT 25",
        ws, q, q
      )
    ]);
    return res.json([...companies, ...people, ...opportunities]);
  } catch (error) {
    console.error('Platform search failed', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/timeline/:entityType/:entityId', authenticate, async (req: AuthRequest, res) => {
  try {
    const ws = await workspaceId(req);
    if (!ws) return res.status(403).json({ error: 'Workspace access denied' });
    const entityType = String(req.params.entityType);
    const entityId = String(req.params.entityId);
    const notes = await prisma.$queryRawUnsafe<any[]>(
      'SELECT n.id,\'note\' AS type,n.body AS content,n.created_at AS date,n.author_id,u.name AS author_name FROM crm_notes n LEFT JOIN users u ON u.id=n.author_id WHERE n.workspace_id=? AND n.entity_type=? AND n.entity_id=? ORDER BY n.created_at DESC LIMIT 100',
      ws, entityType, entityId
    );
    return res.json(notes.map(n => ({ ...n, entityType, entityId })));
  } catch (error) {
    console.error('Platform timeline failed', error);
    return res.status(500).json({ error: 'Timeline failed' });
  }
});

export default router;
