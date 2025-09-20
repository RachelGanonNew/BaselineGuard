Notes for ZKP build:

1) Install circom compiler (binary) and ensure `circom` is on PATH, or use npm installed `circom` if available.
2) powersOfTau file `powersOfTau28_hez_final_10.ptau` is required for setup; download from https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
3) Run `npm run build:circuit` then `npm run setup:zkey` then `npm run export:verifier` to produce a solidity verifier.
4) Start a local Hardhat node with `npx hardhat node` then run `npm run deploy:local` to deploy the verifier.
5) Use `npm run generate:proof 5` to produce a proof for input = 5.

DN: On Windows, ensure Node >= 16 and Python and build tools as needed for dependencies.
