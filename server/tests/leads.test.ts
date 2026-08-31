import request from 'supertest';
import app from '../src/index';

let authToken: string;
let testLeadId: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@amplify.co.ke', password: 'password123' });
  authToken = loginRes.body.token;
});

describe('Leads', () => {
  it('GET /api/leads - returns leads list', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leads)).toBe(true);
  });

  it('GET /api/leads - without auth', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('POST /api/leads - creates new lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Lead',
        company: 'Test Corp',
        value: 100000,
        stage: 'INTAKE',
        email: 'test@example.com',
        phone: '+254700000000',
      });
    expect(res.status).toBe(201);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.name).toBe('Test Lead');
    testLeadId = res.body.lead.id;
  });

  it('PUT /api/leads/:id - updates lead', async () => {
    const res = await request(app)
      .put(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Lead' });
    expect(res.status).toBe(200);
    expect(res.body.lead.name).toBe('Updated Lead');
  });

  it('DELETE /api/leads/:id - deletes lead', async () => {
    const res = await request(app)
      .delete(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
