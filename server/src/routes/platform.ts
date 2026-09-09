import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
const id = () => crypto.randomUUID();
const json = (value: unknown) => JSON.stringify(value ?? {});
const safeJson = (value: unknown, fallback: any = {}) => { try { return value ? JSON.parse(String(value)) : fallback; } catch { return fallback; } };

async function membership(userId: string, workspaceId: string) {
  return prisma.$queryRawUnsafe<any[]>(
    'SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND status = ? LIMIT 1',
    workspaceId, userId, 'active'
  ).then(rows => rows[0] || null);
}

async function requireWorkspace(req: AuthRequest, res: Response): Promise<any | null> {
  const workspaceId = String(req.headers['x-workspace-id'] || req.body?.workspaceId || req.query.workspaceId || '');
  if (!workspaceId || !req.user) { res.status(400).json({ error: 'x-workspace-id is required' }); return null; }
  const member = await membership(req.user.userId, workspaceId);
  if (!member) { res.status(403).json({ error: 'Workspace access denied' }); return null; }
  return member;
}

router.post('/bootstrap', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.$queryRawUnsafe<any[]>('SELECT w.* FROM workspaces w JOIN workspace_members m ON m.workspace_id=w.id WHERE m.user_id=? LIMIT 1', req.user!.userId);
    if (existing[0]) return res.json({ workspace: existing[0], created: false });
    const workspaceId = id();
    const slug = `${String(req.body?.name || 'amplify-workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${workspaceId.slice(0, 8)}`;
    const name = String(req.body?.name || 'My Workspace').slice(0, 120);
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe('INSERT INTO workspaces (id,name,slug) VALUES (?,?,?)', workspaceId, name, slug);
      await tx.$executeRawUnsafe('INSERT INTO workspace_members (id,workspace_id,user_id,role) VALUES (?,?,?,?)', id(), workspaceId, req.user!.userId, 'owner');
      await tx.$executeRawUnsafe('INSERT INTO crm_roles (id,workspace_id,name,description,permissions) VALUES (?,?,?,?,?)', id(), workspaceId, 'Owner', 'Full workspace access', json(['*']));
    });
    const workspace = (await prisma.$queryRawUnsafe<any[]>('SELECT * FROM workspaces WHERE id=?', workspaceId))[0];
    res.status(201).json({ workspace, created: true });
  } catch (error) { console.error('workspace bootstrap', error); res.status(500).json({ error: 'Failed to bootstrap workspace' }); }
});

router.get('/workspaces', authenticate, async (req: AuthRequest, res: Response) => {
  const rows = await prisma.$queryRawUnsafe<any[]>('SELECT w.*, m.role, m.status AS member_status FROM workspaces w JOIN workspace_members m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.name', req.user!.userId);
  res.json(rows);
});

router.get('/members', authenticate, async (req: AuthRequest, res: Response) => {
  if (!await requireWorkspace(req, res)) return;
  const workspaceId = String(req.headers['x-workspace-id'] || req.query.workspaceId);
  const rows = await prisma.$queryRawUnsafe<any[]>('SELECT m.id,m.role,m.status,m.created_at,u.id AS user_id,u.name,u.email,u.avatar FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=? ORDER BY u.name', workspaceId);
  res.json(rows);
});

router.post('/members', authenticate, authorize('ADMIN','MANAGER','SYSTEM_OWNER'), async (req: AuthRequest, res: Response) => {
  if (!await requireWorkspace(req, res)) return;
  const workspaceId = String(req.headers['x-workspace-id'] || req.body.workspaceId);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const role = String(req.body?.role || 'member');
  if (!email) return res.status(400).json({ error: 'email is required' });
  const users = await prisma.$queryRawUnsafe<any[]>('SELECT id,name,email FROM users WHERE lower(email)=? LIMIT 1', email);
  if (!users[0]) return res.status(404).json({ error: 'User not found. Create the user account first.' });
  await prisma.$executeRawUnsafe('INSERT OR IGNORE INTO workspace_members (id,workspace_id,user_id,role) VALUES (?,?,?,?)', id(), workspaceId, users[0].id, role);
  res.status(201).json({ success: true, user: users[0], role });
});

router.get('/companies', authenticate, async (req: AuthRequest, res: Response) => {
  if (!await requireWorkspace(req, res)) return;
  const workspaceId = String(req.headers['x-workspace-id'] || req.query.workspaceId); const q = String(req.query.q || '').trim();
  const rows = q ? await prisma.$queryRawUnsafe<any[]>('SELECT * FROM companies WHERE workspace_id=? AND (name LIKE ? OR email LIKE ? OR domain LIKE ?) ORDER BY name LIMIT 200', workspaceId, `%${q}%`, `%${q}%`, `%${q}%`) : await prisma.$queryRawUnsafe<any[]>('SELECT * FROM companies WHERE workspace_id=? ORDER BY updated_at DESC LIMIT 200', workspaceId);
  res.json(rows.map(r => ({ ...r, metadata: safeJson(r.metadata) })));
});
router.post('/companies', authenticate, async (req: AuthRequest, res: Response) => {
  if (!await requireWorkspace(req, res)) return; const workspaceId=String(req.headers['x-workspace-id']||req.body.workspaceId); const body=req.body||{};
  if (!body.name) return res.status(400).json({error:'name is required'}); const companyId=id();
  await prisma.$executeRawUnsafe('INSERT INTO companies (id,workspace_id,name,domain,industry,phone,email,website,address,status,owner_id,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', companyId,workspaceId,String(body.name),body.domain||null,body.industry||null,body.phone||null,body.email||null,body.website||null,body.address||null,body.status||'active',req.user!.userId,json(body.metadata));
  res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM companies WHERE id=?',companyId))[0]);
});
router.put('/companies/:id', authenticate, async (req: AuthRequest,res:Response)=>{ if(!await requireWorkspace(req,res))return; const ws=String(req.headers['x-workspace-id']||req.body.workspaceId); const b=req.body||{}; const fields=['name','domain','industry','phone','email','website','address','status','metadata']; const sets=fields.filter(f=>b[f]!==undefined).map(f=>`${f}=?`); if(!sets.length)return res.status(400).json({error:'No fields to update'}); const vals=fields.filter(f=>b[f]!==undefined).map(f=>f==='metadata'?json(b[f]):b[f]); await prisma.$executeRawUnsafe(`UPDATE companies SET ${sets.join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=? AND workspace_id=?`,...vals,req.params.id,ws); res.json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM companies WHERE id=? AND workspace_id=?',req.params.id,ws))[0]||null); });
router.delete('/companies/:id', authenticate, authorize('ADMIN','MANAGER','SYSTEM_OWNER'), async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId);await prisma.$executeRawUnsafe('DELETE FROM companies WHERE id=? AND workspace_id=?',req.params.id,ws);res.status(204).send();});

router.get('/people', authenticate, async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const q=String(req.query.q||'').trim();const sql=q?'SELECT p.*,c.name AS company_name FROM people p LEFT JOIN companies c ON c.id=p.company_id WHERE p.workspace_id=? AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ? OR c.name LIKE ?) ORDER BY p.updated_at DESC LIMIT 300':'SELECT p.*,c.name AS company_name FROM people p LEFT JOIN companies c ON c.id=p.company_id WHERE p.workspace_id=? ORDER BY p.updated_at DESC LIMIT 300';const rows=q?await prisma.$queryRawUnsafe<any[]>(sql,ws,`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`):await prisma.$queryRawUnsafe<any[]>(sql,ws);res.json(rows);});
router.post('/people',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.firstName)return res.status(400).json({error:'firstName is required'});const pid=id();await prisma.$executeRawUnsafe('INSERT INTO people (id,workspace_id,company_id,first_name,last_name,email,phone,job_title,linkedin_url,status,owner_id,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',pid,ws,b.companyId||null,b.firstName,b.lastName||null,b.email||null,b.phone||null,b.jobTitle||null,b.linkedinUrl||null,b.status||'active',req.user!.userId,json(b.metadata));res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM people WHERE id=?',pid))[0]);});
router.put('/people/:id',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};const map:any={firstName:'first_name',lastName:'last_name',companyId:'company_id',email:'email',phone:'phone',jobTitle:'job_title',linkedinUrl:'linkedin_url',status:'status',metadata:'metadata'};const keys=Object.keys(map).filter(k=>b[k]!==undefined);if(!keys.length)return res.status(400).json({error:'No fields to update'});const vals=keys.map(k=>k==='metadata'?json(b[k]):b[k]);await prisma.$executeRawUnsafe(`UPDATE people SET ${keys.map(k=>`${map[k]}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=? AND workspace_id=?`,...vals,req.params.id,ws);res.json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM people WHERE id=? AND workspace_id=?',req.params.id,ws))[0]||null);});
router.delete('/people/:id',authenticate,authorize('ADMIN','MANAGER','SYSTEM_OWNER'),async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id')||req.body.workspaceId);await prisma.$executeRawUnsafe('DELETE FROM people WHERE id=? AND workspace_id=?',req.params.id,ws);res.status(204).send();});

router.get('/opportunities',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const rows=await prisma.$queryRawUnsafe<any[]>('SELECT o.*,c.name AS company_name,p.first_name AS contact_first_name,p.last_name AS contact_last_name,u.name AS owner_name FROM opportunities o LEFT JOIN companies c ON c.id=o.company_id LEFT JOIN people p ON p.id=o.primary_person_id LEFT JOIN users u ON u.id=o.owner_id WHERE o.workspace_id=? ORDER BY o.updated_at DESC LIMIT 500',ws);res.json(rows.map(r=>({...r,metadata:safeJson(r.metadata)})));});
router.post('/opportunities',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.name)return res.status(400).json({error:'name is required'});const oid=id();await prisma.$executeRawUnsafe('INSERT INTO opportunities (id,workspace_id,company_id,primary_person_id,name,amount,stage,probability,expected_close_date,owner_id,source,description,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',oid,ws,b.companyId||null,b.primaryPersonId||null,b.name,Number(b.amount||0),b.stage||'INTAKE',Math.max(0,Math.min(100,Number(b.probability??10))),b.expectedCloseDate||null,b.ownerId||req.user!.userId,b.source||null,b.description||null,json(b.metadata));res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM opportunities WHERE id=?',oid))[0]);});
router.patch('/opportunities/:id',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};const map:any={name:'name',amount:'amount',stage:'stage',probability:'probability',expectedCloseDate:'expected_close_date',companyId:'company_id',primaryPersonId:'primary_person_id',ownerId:'owner_id',source:'source',description:'description',metadata:'metadata'};const keys=Object.keys(map).filter(k=>b[k]!==undefined);if(!keys.length)return res.status(400).json({error:'No fields to update'});const vals=keys.map(k=>k==='metadata'?json(b[k]):b[k]);await prisma.$executeRawUnsafe(`UPDATE opportunities SET ${keys.map(k=>`${map[k]}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=? AND workspace_id=?`,...vals,req.params.id,ws);res.json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM opportunities WHERE id=? AND workspace_id=?',req.params.id,ws))[0]||null);});

router.get('/notes',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const entity=String(req.query.entityType||''),eid=String(req.query.entityId||'');const rows=entity&&eid?await prisma.$queryRawUnsafe<any[]>('SELECT n.*,u.name AS author_name FROM crm_notes n LEFT JOIN users u ON u.id=n.author_id WHERE n.workspace_id=? AND n.entity_type=? AND n.entity_id=? ORDER BY n.created_at DESC',ws,entity,eid):await prisma.$queryRawUnsafe<any[]>('SELECT n.*,u.name AS author_name FROM crm_notes n LEFT JOIN users u ON u.id=n.author_id WHERE n.workspace_id=? ORDER BY n.created_at DESC LIMIT 200',ws);res.json(rows);});
router.post('/notes',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.entityType||!b.entityId||!b.body)return res.status(400).json({error:'entityType, entityId and body are required'});const nid=id();await prisma.$executeRawUnsafe('INSERT INTO crm_notes (id,workspace_id,entity_type,entity_id,body,author_id) VALUES (?,?,?,?,?,?)',nid,ws,b.entityType,b.entityId,b.body,req.user!.userId);res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM crm_notes WHERE id=?',nid))[0]);});

router.get('/custom-fields',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const rows=await prisma.$queryRawUnsafe<any[]>('SELECT * FROM custom_field_definitions WHERE workspace_id=? AND (?="" OR entity_type=?) ORDER BY name',ws,String(req.query.entityType||''),String(req.query.entityType||''));res.json(rows.map(r=>({...r,options:safeJson(r.options,[]),required:Boolean(r.required)})));});
router.post('/custom-fields',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.entityType||!b.name||!b.key)return res.status(400).json({error:'entityType, name and key are required'});const fid=id();await prisma.$executeRawUnsafe('INSERT INTO custom_field_definitions (id,workspace_id,entity_type,name,key,field_type,options,required) VALUES (?,?,?,?,?,?,?,?)',fid,ws,b.entityType,b.name,b.key,b.fieldType||'text',json(b.options||[]),b.required?1:0);res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM custom_field_definitions WHERE id=?',fid))[0]);});
router.put('/custom-fields/:id/value',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId);const defs=await prisma.$queryRawUnsafe<any[]>('SELECT d.* FROM custom_field_definitions d WHERE d.id=? AND d.workspace_id=?',req.params.id,ws);if(!defs[0])return res.status(404).json({error:'Field not found'});const vid=id();await prisma.$executeRawUnsafe('INSERT INTO custom_field_values (id,definition_id,entity_id,value) VALUES (?,?,?,?) ON CONFLICT(definition_id,entity_id) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP',vid,req.params.id,String(req.body.entityId),req.body.value==null?null:String(req.body.value));res.json({success:true});});

router.get('/views',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const rows=await prisma.$queryRawUnsafe<any[]>('SELECT * FROM saved_views WHERE workspace_id=? AND (?="" OR entity_type=?) ORDER BY name',ws,String(req.query.entityType||''),String(req.query.entityType||''));res.json(rows.map(r=>({...r,filters:safeJson(r.filters),columns:safeJson(r.columns,[]),isShared:Boolean(r.is_shared)})));});
router.post('/views',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.entityType||!b.name)return res.status(400).json({error:'entityType and name are required'});const vid=id();await prisma.$executeRawUnsafe('INSERT INTO saved_views (id,workspace_id,entity_type,name,filters,columns,sort,is_shared,owner_id) VALUES (?,?,?,?,?,?,?,?,?)',vid,ws,b.entityType,b.name,json(b.filters||{}),json(b.columns||[]),b.sort||null,b.isShared?1:0,req.user!.userId);res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM saved_views WHERE id=?',vid))[0]);});
router.delete('/views/:id',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId);await prisma.$executeRawUnsafe('DELETE FROM saved_views WHERE id=? AND workspace_id=?',req.params.id,ws);res.status(204).send();});

router.get('/search',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId),q=`%${String(req.query.q||'').trim()}%`;if(q==='%%')return res.json([]);const [companies,people,opps,leads,clients]=await Promise.all([
 prisma.$queryRawUnsafe<any[]>('SELECT id,name,domain FROM companies WHERE workspace_id=? AND name LIKE ? LIMIT 25',ws,q),
 prisma.$queryRawUnsafe<any[]>('SELECT id,first_name,last_name,email,company_id FROM people WHERE workspace_id=? AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) LIMIT 25',ws,q,q,q),
 prisma.$queryRawUnsafe<any[]>('SELECT id,name,amount,stage,company_id FROM opportunities WHERE workspace_id=? AND name LIKE ? LIMIT 25',ws,q),
 prisma.$queryRawUnsafe<any[]>('SELECT id,name,company,value,stage FROM leads WHERE name LIKE ? OR company LIKE ? LIMIT 25',q,q),
 prisma.$queryRawUnsafe<any[]>('SELECT id,name,company,email,total_revenue FROM clients WHERE name LIKE ? OR company LIKE ? LIMIT 25',q,q)
]);res.json({companies,people,opportunities:opps,leads,clients});});

router.get('/roles',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const rows=await prisma.$queryRawUnsafe<any[]>('SELECT * FROM crm_roles WHERE workspace_id=? ORDER BY name',ws);res.json(rows.map(r=>({...r,permissions:safeJson(r.permissions,[])})));});
router.post('/roles',authenticate,authorize('ADMIN','MANAGER','SYSTEM_OWNER'),async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};if(!b.name)return res.status(400).json({error:'name is required'});const rid=id();await prisma.$executeRawUnsafe('INSERT INTO crm_roles (id,workspace_id,name,description,permissions) VALUES (?,?,?,?,?)',rid,ws,b.name,b.description||null,json(b.permissions||[]));res.status(201).json((await prisma.$queryRawUnsafe<any[]>('SELECT * FROM crm_roles WHERE id=?',rid))[0]);});
router.put('/roles/:id',authenticate,authorize('ADMIN','MANAGER','SYSTEM_OWNER'),async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.body.workspaceId),b=req.body||{};await prisma.$executeRawUnsafe('UPDATE crm_roles SET name=COALESCE(?,name),description=COALESCE(?,description),permissions=COALESCE(?,permissions),updated_at=CURRENT_TIMESTAMP WHERE id=? AND workspace_id=?',b.name||null,b.description||null,b.permissions===undefined?null:json(b.permissions),req.params.id,ws);res.json({success:true});});

router.get('/export/:entity',authenticate,async(req:AuthRequest,res:Response)=>{if(!await requireWorkspace(req,res))return;const ws=String(req.headers['x-workspace-id']||req.query.workspaceId);const entity=String(req.params.entity);const tables:any={companies:'companies',people:'people',opportunities:'opportunities'};if(!tables[entity])return res.status(400).json({error:'Unsupported export entity'});const rows=await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ${tables[entity]} WHERE workspace_id=? ORDER BY updated_at DESC`,ws);const keys=rows.length?Object.keys(rows[0]):[];const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""').replace(/\n/g,' ')}"`;const csv=[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');res.type('text/csv').setHeader('Content-Disposition',`attachment; filename="${entity}.csv"`).send(csv);});

export default router;
