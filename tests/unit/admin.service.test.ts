import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adminService } from '../../src/modules/admin/admin.service.js';

describe('AdminService agregaciones', () => {
  it('computeTrendPercent retorna null si el periodo anterior es cero', () => {
    assert.equal(adminService.computeTrendPercent(10, 0), null);
  });

  it('computeTrendPercent calcula variacion redondeada', () => {
    assert.equal(adminService.computeTrendPercent(12, 10), 20);
    assert.equal(adminService.computeTrendPercent(9, 10), -10);
  });

  it('computeCampaignProgressPercent respeta tope 100 y vacio', () => {
    assert.equal(adminService.computeCampaignProgressPercent([]), 0);
    assert.equal(
      adminService.computeCampaignProgressPercent([
        { quantity: 10, fulfilledQuantity: 5 },
        { quantity: 10, fulfilledQuantity: 5 },
      ]),
      50,
    );
    assert.equal(
      adminService.computeCampaignProgressPercent([
        { quantity: 10, fulfilledQuantity: 15 },
      ]),
      100,
    );
  });

  it('computeDaysRemaining usa ceil en dias', () => {
    const now = new Date('2026-07-21T12:00:00.000Z');
    const end = new Date('2026-07-23T01:00:00.000Z');
    assert.equal(adminService.computeDaysRemaining(end, now), 2);
    assert.equal(adminService.computeDaysRemaining(null, now), null);
  });
});
