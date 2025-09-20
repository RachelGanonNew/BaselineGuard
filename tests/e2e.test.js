const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '..', 'data', 'audit_ledger.json');

beforeEach(() => {
  fs.writeFileSync(LEDGER_PATH, '[]');
});

test('e2e demo proof -> verify -> ledger', async () => {
  // create claim
  const claimRes = await request(app).post('/claim').send({ supplierId: 's-demo', data: { in: 5 } });
  expect(claimRes.status).toBe(200);
  const claim = claimRes.body;

  // prove (uses precomputed proof)
  const proveRes = await request(app).post('/prove').send({ claim });
  expect(proveRes.status).toBe(200);
  const proofBundle = proveRes.body.proofBundle;
  expect(proofBundle).toBeDefined();

  // verify locally
  const verifyRes = await request(app).post('/verify').send({ claim, proof: proofBundle, verifier: 'e2e' });
  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.verified).toBe(true);

  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  expect(ledger.length).toBe(1);
  expect(ledger[0].claimId).toBe(claim.id);
});
