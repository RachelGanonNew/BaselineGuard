const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const buildDir = path.join(__dirname, '..', 'circuits', 'build');

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}

function ensureBuild() {
  if (!fs.existsSync(buildDir)) {
    console.error('circuits/build not found. Compile the circuit first:');
    console.error('  npx circom circuits/square.circom --r1cs --wasm --sym -o circuits/build');
    process.exit(1);
  }
}

function generate(inValue = 5) {
  ensureBuild();
  // Require that the compiled circuit artifacts exist (real flow)
  const required = [ 'square.r1cs', 'square.wasm', path.join('square_js', 'generate_witness.js') ];
  for (const f of required) {
    if (!fs.existsSync(path.join(buildDir, f))) {
      console.error(`Missing required build artifact: circuits/build/${f}`);
      console.error('Run: npx circom circuits/square.circom --r1cs --wasm --sym -o circuits/build');
      process.exit(1);
    }
  }
  const ptau = path.join(buildDir, 'powersOfTau28_hez_final_10.ptau');
  if (!fs.existsSync(ptau)) {
    run(`npx snarkjs powersoftau new bn128 10 ${ptau}`);
    run(`npx snarkjs powersoftau contribute ${ptau} ${ptau} --name="contrib" -v`);
  }

  run(`npx snarkjs groth16 setup ${path.join(buildDir,'square.r1cs')} ${ptau} ${path.join(buildDir,'square_0000.zkey')}`);
  run(`npx snarkjs zkey contribute ${path.join(buildDir,'square_0000.zkey')} ${path.join(buildDir,'square_final.zkey')} -e="contrib"`);
  run(`npx snarkjs zkey export solidityverifier ${path.join(buildDir,'square_final.zkey')} ${path.join(process.cwd(),'contracts','Verifier.sol')}`);

  const inputJson = path.join(buildDir, 'input.json');
  fs.writeFileSync(inputJson, JSON.stringify({ in: Number(inValue) }));
  run(`node ${path.join(buildDir,'square_js','generate_witness.js')} ${path.join(buildDir,'square.wasm')} ${inputJson} ${path.join(buildDir,'witness.wtns')}`);
  run(`npx snarkjs groth16 prove ${path.join(buildDir,'square_final.zkey')} ${path.join(buildDir,'witness.wtns')} ${path.join(buildDir,'proof.json')} ${path.join(buildDir,'public.json')}`);

  console.log('Proof and public data generated in circuits/build');
}

const inArg = process.argv[2] || '5';
generate(inArg);
console.log('Done');
