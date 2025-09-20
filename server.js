const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
let zk;
try {
  zk = require('./zk_real');
} catch (e) {
  // If real zk toolchain isn't available yet, fall back to stub for now
  zk = require('./zk_stub');
}

const DATA_DIR = path.join(__dirname, 'data');
const LEDGER_PATH = path.join(DATA_DIR, 'audit_ledger.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEDGER_PATH)) fs.writeFileSync(LEDGER_PATH, '[]');

const app = express();
app.use(bodyParser.json());
app.use(require('cors')());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for claims (simple demo)
const claims = {};

app.post('/claim', (req, res) => {
  const { supplierId, data } = req.body;
  if (!supplierId || !data) return res.status(400).json({ error: 'supplierId and data required' });
  const id = uuidv4();
  const claim = { id, supplierId, data, timestamp: Date.now() };
  claims[id] = claim;
  return res.json(claim);
});

app.post('/prove', (req, res) => {
  const { claim } = req.body;
  if (!claim || !claim.id) return res.status(400).json({ error: 'claim required' });
  // zk.generateProof may be async if using real snarkjs flow
  Promise.resolve(zk.generateProof(claim))
    .then((proofBundle) => res.json({ proofBundle }))
    .catch((err) => res.status(500).json({ error: String(err) }));
});

app.post('/verify', (req, res) => {
  const { claim, proof, verifier } = req.body;
  if (!claim || !proof) return res.status(400).json({ error: 'claim and proof required' });
  // decide whether to verify on-chain or locally
  const doOnChain = process.env.VERIFY_ON_CHAIN === '1';
  const verifyPromise = doOnChain ? zk.verifyProofOnChain(proof, claim) : Promise.resolve(zk.verifyProofLocal(proof));
  Promise.resolve(verifyPromise)
    .then((result) => {
      const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
      const entry = { id: uuidv4(), proofId: proof.id || null, claimId: claim.id, verifier: verifier || 'anonymous', timestamp: Date.now() };
      if (typeof result === 'object' && result.tx) entry.tx = result.tx;
      fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger.concat([entry]), null, 2));
      return res.json({ verified: !!result, tx: result && result.tx ? result.tx : undefined });
    })
    .catch((err) => res.status(500).json({ error: String(err) }));
});

app.get('/audit', (req, res) => {
  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  return res.json(ledger);
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`BaselineGuard prototype listening on ${port}`));
}
