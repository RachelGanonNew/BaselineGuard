const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '..', 'data', 'audit_ledger.json');

beforeEach(() => {
  fs.writeFileSync(LEDGER_PATH, '[]');
});

test('verification fails for mismatched public signal', async () => {
  const claimRes = await request(app).post('/claim').send({ supplierId: 's-neg', data: { in: 7 } });
  const claim = claimRes.body;

  // use precomputed proof (public=25) while claim in=7 -> 49 expected => should fail
  const proveRes = await request(app).post('/prove').send({ claim });
  const proofBundle = proveRes.body.proofBundle;

  const verifyRes = await request(app).post('/verify').send({ claim, proof: proofBundle, verifier: 'neg' });
  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.verified).toBe(false);
});
