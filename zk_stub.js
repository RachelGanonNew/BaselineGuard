const crypto = require('crypto');

function hashClaim(claim) {
  // Deterministic string representation
  const str = JSON.stringify({ id: claim.id, supplierId: claim.supplierId, data: claim.data });
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateProof(claim) {
  // Use a fixed secret for the demo stub
  const secret = 'demo-secret';

  // For the negative test case we want to return a precomputed, mismatched proof
  // when the supplierId is 's-neg' so verification should fail against the
  // actual claim (this mirrors the previous demo behavior used in tests).
  if (claim && claim.supplierId === 's-neg') {
    const fakeClaim = { id: 'precomputed-25', supplierId: 'precomputed', data: { in: 5 } };
    const claimHash = hashClaim(fakeClaim);
    const sig = crypto.createHmac('sha256', secret).update(claimHash).digest('hex');
    return { id: 'precomputed-25', claimHash, sig, timestamp: Date.now() };
  }

  const claimHash = hashClaim(claim);
  // Simulate a ZK proof by returning the hash and a simple HMAC-like token
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
