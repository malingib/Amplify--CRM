import request from 'supertest';
import app from '../src/index';

let authToken: string;
let testClientId: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@amplify.co.ke', password: 'password123' });
  authToken = loginRes.body.token;
});

describe('Clients', () => {
  it('GET /api/clients - returns clients list', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(res.body.clients.length).toBeGreaterThan(0);
  });

  it('GET /api/clients - without auth', async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
  });

  it('POST /api/clients - creates new client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Client',
        company: 'Test Industries',
        email: 'test@client.com',
        phone: '+254700000001',
        industry: 'Technology',
      });
    expect(res.status).toBe(201);
    expect(res.body.client).toBeDefined();
    expect(res.body.client.name).toBe('Test Client');
    testClientId = res.body.client.id;
  });

  it('GET /api/clients/:id - returns single client', async () => {
    const res = await request(app)
      .get(`/api/clients/${testClientId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.client.name).toBe('Test Client');
  });

  it('PUT /api/clients/:id - updates client', async () => {
    const res = await request(app)
      .put(`/api/clients/${testClientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Client' });
    expect(res.status).toBe(200);
    expect(res.body.client.name).toBe('Updated Client');
  });

  it('DELETE /api/clients/:id - deletes client', async () => {
    const res = await request(app)
      .delete(`/api/clients/${testClientId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
