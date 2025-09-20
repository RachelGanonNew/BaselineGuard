const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '..', 'data', 'audit_ledger.json');

beforeEach(() => {
  fs.writeFileSync(LEDGER_PATH, '[]');
});

test('create claim -> prove -> verify -> ledger entry', async () => {
  const claimRes = await request(app).post('/claim').send({ supplierId: 's1', data: { cert: 'ISO' } });
  expect(claimRes.status).toBe(200);
  const claim = claimRes.body;

  const proofRes = await request(app).post('/prove').send({ claim });
  expect(proofRes.status).toBe(200);
  const proofBundle = proofRes.body.proofBundle;

  const verifyRes = await request(app).post('/verify').send({ claim, proof: proofBundle, verifier: 'v1' });
  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.verified).toBe(true);

  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  expect(ledger.length).toBe(1);
  expect(ledger[0].claimId).toBe(claim.id);
});
