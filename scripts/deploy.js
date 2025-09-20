const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const Verifier = await hre.ethers.getContractFactory('Verifier');
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log('Verifier deployed to:', verifier.address);

  const out = { verifier: verifier.address };
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'verifier.json'), JSON.stringify(out, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const hre = require('hardhat');

async function main() {
  const Verifier = await hre.ethers.getContractFactory('Verifier');
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log('Verifier deployed to:', verifier.address);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
