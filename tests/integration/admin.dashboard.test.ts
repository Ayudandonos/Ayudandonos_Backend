import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { jwtUtil } from '../../src/utils/jwt.util.js';

const app = createApp();

const adminToken = jwtUtil.sign({
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'admin-test@ayudandonos.test',
  role: 'ADMIN',
});

const userToken = jwtUtil.sign({
  sub: '00000000-0000-4000-8000-000000000002',
  email: 'user-test@ayudandonos.test',
  role: 'USER',
});

const foundationToken = jwtUtil.sign({
  sub: '00000000-0000-4000-8000-000000000003',
  email: 'foundation-test@ayudandonos.test',
  role: 'FOUNDATION',
});

describe('GET /api/v1/admin/dashboard', () => {
  it('responde 401 sin token', async () => {
    const response = await request(app).get('/api/v1/admin/dashboard');

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
  });

  it('responde 403 con rol USER', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
  });

  it('responde 403 con rol FOUNDATION', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${foundationToken}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
  });

  it('responde 200 con rol ADMIN y contrato de data', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(typeof response.body.message, 'string');
    assert.equal(response.body.errors, null);

    const { data } = response.body;
    assert.ok(data.kpis);
    assert.equal(typeof data.kpis.activeCampaigns, 'number');
    assert.equal(typeof data.kpis.pendingNeeds, 'number');
    assert.equal(typeof data.kpis.deliveredAids, 'number');
    assert.equal(typeof data.kpis.verifiedFoundations, 'number');
    assert.ok(Array.isArray(data.latestNeeds));
    assert.ok(Array.isArray(data.featuredCampaigns));

    if (data.latestNeeds.length > 0) {
      const item = data.latestNeeds[0];
      assert.equal(typeof item.id, 'string');
      assert.equal(typeof item.name, 'string');
      assert.equal(typeof item.foundationName, 'string');
      assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(item.priority));
      assert.equal(typeof item.publishedAt, 'string');
    }

    if (data.featuredCampaigns.length > 0) {
      const featured = data.featuredCampaigns[0];
      assert.equal(typeof featured.id, 'string');
      assert.equal(typeof featured.title, 'string');
      assert.equal(typeof featured.description, 'string');
      assert.ok(
        featured.imageUrl === null || typeof featured.imageUrl === 'string',
      );
      assert.equal(typeof featured.progressPercent, 'number');
      assert.ok(
        featured.daysRemaining === null || typeof featured.daysRemaining === 'number',
      );
      assert.equal(featured.isPrimary, true);
    }
  });
});
