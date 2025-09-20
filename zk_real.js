const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ethers = require('ethers');

const buildDir = path.join(__dirname, 'circuits', 'build');

function run(cmd) {
  console.log('> ' + cmd);
  return execSync(cmd, { stdio: 'inherit' });
}

function ensureBuild() {
  if (!fs.existsSync(buildDir)) {
  throw new Error('circuits/build not found. Compile the circuit first: npx circom circuits/square.circom --r1cs --wasm --sym -o circuits/build (or run ci/run_e2e.sh to build with Docker)');
  }
}

function generateProof(claim) {
  // Build input from claim (use numeric field `in` or `emissions` as fallback)
  const input = { in: Number(claim.data?.in ?? claim.data?.emissions ?? 5) };
  ensureBuild();
  fs.writeFileSync(path.join(buildDir, 'input.json'), JSON.stringify(input));
  // Require compiled artifacts for the real proving flow
  const wasm = path.join(buildDir, 'square.wasm');
  const witnessGen = path.join(buildDir, 'square_js', 'generate_witness.js');
  const zkey = path.join(buildDir, 'square_final.zkey');

  if (!fs.existsSync(wasm) || !fs.existsSync(witnessGen) || !fs.existsSync(zkey)) {
    throw new Error('Missing compiled circuit artifacts. Run the circuit build (npx circom ...) or run ci/run_e2e.sh to produce: square.wasm, square_js/generate_witness.js, square_final.zkey');
  }

  // generate witness and proof (real flow)
  run(`node "${witnessGen}" "${wasm}" "${path.join(buildDir, 'input.json')}" "${path.join(buildDir, 'witness.wtns')}"`);
  run(`npx snarkjs groth16 prove "${zkey}" "${path.join(buildDir, 'witness.wtns')}" "${path.join(buildDir, 'proof.json')}" "${path.join(buildDir, 'public.json')}"`);

  const proof = JSON.parse(fs.readFileSync(path.join(buildDir, 'proof.json'), 'utf8'));
  const publicSignals = JSON.parse(fs.readFileSync(path.join(buildDir, 'public.json'), 'utf8'));
  return { proof, publicSignals };
}

function verifyProofLocal(proofBundle) {
  // Require verification key for local verification using snarkjs
  const vkPath = path.join(buildDir, 'verification_key.json');
  if (!fs.existsSync(vkPath)) {
    throw new Error('Missing verification_key.json in circuits/build. Export the verification key during your zkey setup or run ci/run_e2e.sh to generate it.');
  }

  // write proof/public to temp files and run snarkjs verify
  const tempProof = path.join(buildDir, 'proof.json');
  const tempPublic = path.join(buildDir, 'public.json');
  fs.writeFileSync(tempProof, JSON.stringify(proofBundle.proof));
  fs.writeFileSync(tempPublic, JSON.stringify(proofBundle.publicSignals));
  try {
    run(`npx snarkjs groth16 verify "${vkPath}" "${tempPublic}" "${tempProof}"`);
    return true;
  } catch (e) {
    return false;
  }
}

async function verifyProofOnChain(proofBundle) {
  // Call deployed verifier contract (expects verifier address in data/verifier.json)
  const verifierFile = path.join(__dirname, 'data', 'verifier.json');
  if (!fs.existsSync(verifierFile)) throw new Error('verifier.json not found — deploy contracts with `npm run deploy:local`');
  const { verifier } = JSON.parse(fs.readFileSync(verifierFile, 'utf8'));

  const providerUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = provider.getSigner(0);
  const contractAbi = [
    'function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[] memory input) public view returns (bool)'
  ];
  const contract = new ethers.Contract(verifier, contractAbi, signer);

  const { proof, publicSignals } = proofBundle;
  const a = proof.pi_a.map((x) => BigInt(x));
  const b = proof.pi_b.map((row) => row.map((x) => BigInt(x)));
  const c = proof.pi_c.map((x) => BigInt(x));
  const input = publicSignals.map((x) => BigInt(x));

  const ok = await contract.verifyProof(a, b, c, input);
  return ok;
}

module.exports = { generateProof, verifyProofLocal, verifyProofOnChain };
