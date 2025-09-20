![CI](https://github.com/RachelGanonNew/BaselineGuard/actions/workflows/docker-ci.yml/badge.svg)

BaselineGuard — Baseline Protocol demo prototype

This repository contains a small prototype demonstrating a Baseline Protocol-aligned idea: suppliers can create compliance claims, generate zero-knowledge-style proofs (stubbed), and verifiers can verify proofs and write audit entries to an on-disk ledger.

Files created
- `server.js` - Express API server (exports `app` for tests)
- `zk_stub.js` - Simple deterministic proof generator & verifier (stub for real ZK)
- `data/audit_ledger.json` - Append-only audit ledger (JSON)

Quick setup (PowerShell)

```powershell
cd C:\Users\USER\BaselineGuard
npm install
npm test
npm start
```

Alternatively, run the Docker-based CI locally (requires Docker Desktop):

```powershell
# Run the Docker-based CI which builds the circuit and runs tests
npm run ci:docker
```

ZKP + on-chain (Circom + snarkjs + Hardhat)

Prerequisites: Node >=16, Python build tools on Windows, and the `circom` compiler available (either installed globally or via npm). Download `powersOfTau28_hez_final_10.ptau` and place it in `circuits/build/` or the project root.

Build & deploy (local)

Prerequisite: install the `circom` compiler. On Windows you can either install the `circom-compiler` npm helper or use the official circom binary or Docker image. A helper script is included at `scripts/setup_circom.ps1` which attempts the npm helper install.

```powershell
cd C:\Users\USER\BaselineGuard
npm install
# If you don't have circom, run the helper (may still require manual install):
powershell -ExecutionPolicy Bypass -File .\scripts\setup_circom.ps1

# Compile the circuit (requires circom available as npx circom)
npx circom circuits/square.circom --r1cs --wasm --sym -o circuits/build

# Setup zkey and export verifier
npm run setup:zkey
npm run export:verifier

# Start a local Hardhat node in a separate terminal and deploy
npx hardhat node
npm run deploy:local

# Generate a proof with example input=5
npm run generate:proof -- 5
```

After deploy, set the `VERIFIER_ADDRESS` env var to the deployed contract address and call `/prove` then `/verify` to exercise on-chain verification. The server will append tx info to `data/audit_ledger.json`.

What this is
- A minimal, self-contained demo to showcase the BaselineGuard concept.
- Proofs are simulated; for the hackathon you should replace `zk_stub.js` with a real ZK proof system (e.g., Circom + snarkjs or a Halo2 flow) and integrate Baseline Protocol messaging.

Next steps
- Add a rich frontend showcasing supplier/buyer flows.
- Replace proof stub with genuine ZKPs and demonstrate on-chain verification via a public testnet smart contract (or simulated chain).
- Integrate with ERP data and add privacy-preserving schemas.

CI and reproducible e2e
- A GitHub Actions workflow is included at `.github/workflows/e2e.yml` to run the full build (uses Docker to run circom).
- A local helper script is in `ci/run_e2e.sh` for Linux/macOS environments with Docker.

Pitch materials
- See `PITCH_DECK.md` for a short judge-facing pitch outline.

Judge checklist
- Start the server: `npm start` and open http://localhost:3000
- Fetch ERP data (button) and create a claim
- Generate a proof and verify it (local proof verification uses demo artifacts if circom missing)
- Optionally run full e2e to deploy verifier and show on-chain verification using Docker: `ci/run_e2e.sh` (requires Docker)

Recording tips
- Use the `DEMO_SCRIPT.md` to record a 90–120s demo; focus on the private proof generation and the on-chain audit entry.
