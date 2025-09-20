const crypto = require('crypto');

function hashClaim(claim) {
  // Deterministic string representation
  const str = JSON.stringify({ id: claim.id, supplierId: claim.supplierId, data: claim.data });
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateProof(claim) {
  const claimHash = hashClaim(claim);
  // Simulate a ZK proof by returning the hash and a simple HMAC-like token
  const secret = 'demo-secret';
  const sig = crypto.createHmac('sha256', secret).update(claimHash).digest('hex');
  return { id: crypto.randomUUID(), claimHash, sig, timestamp: Date.now() };
}

function verifyProof(proof, claim) {
  if (!proof || !claim) return false;
  const expectedHash = hashClaim(claim);
  if (expectedHash !== proof.claimHash) return false;
  const secret = 'demo-secret';
  const expectedSig = crypto.createHmac('sha256', secret).update(proof.claimHash).digest('hex');
  return expectedSig === proof.sig;
}

module.exports = { generateProof, verifyProof };
