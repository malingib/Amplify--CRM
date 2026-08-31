import request from 'supertest';
import app from '../src/index';

describe('Auth', () => {
  it('POST /api/auth/login - valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@amplify.co.ke', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@amplify.co.ke');
  });

  it('POST /api/auth/login - invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@amplify.co.ke', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login - missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@amplify.co.ke' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register - creates new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ 
        email: `test${Date.now()}@example.com`, 
        password: 'password123', 
        name: 'Test User' 
      });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
  });

  it('GET /api/auth/me - with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@amplify.co.ke', password: 'password123' });
    
    const token = loginRes.body.token;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@amplify.co.ke');
  });

  it('GET /api/auth/me - without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
