#!/usr/bin/env bash
# ci/run_e2e.sh
# Robust local CI script to build the Circom circuit, produce zkey/verifier, deploy locally and run tests.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "Installing dependencies..."
npm ci

echo "Ensure snarkjs available (local install)..."
npm i --no-audit --no-fund snarkjs@0.7.5

mkdir -p circuits/build

echo "Compiling Circom circuit (circuits/square.circom)"
if command -v circom >/dev/null 2>&1; then
	circom circuits/square.circom --r1cs --wasm --sym -o circuits/build
elif docker --version >/dev/null 2>&1; then
		docker run --rm -v "$ROOT:/work" -w /work iden3/circom:latest circom circuits/square.circom --r1cs --wasm --sym -o circuits/build
else
	echo "No circom binary or Docker available. Please install circom or Docker, or run this in CI where Docker is available."
	exit 2
fi

cd circuits/build

PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau"
PTAU_FILE="powersOfTau28_hez_final_10.ptau"
EXPECTED_SHA256="REPLACE_WITH_TRUSTED_SHA256"

download_ptau() {
	echo "Downloading PTau from $PTAU_URL"
	curl -fsSL -o "$PTAU_FILE" "$PTAU_URL" || return 1
}

if [ ! -f "$PTAU_FILE" ]; then
	download_ptau || { echo "PTau download failed"; exit 1; }
fi

if command -v sha256sum >/dev/null 2>&1; then
	ACTUAL_SHA256=$(sha256sum "$PTAU_FILE" | awk '{print $1}')
else
	ACTUAL_SHA256=$(openssl dgst -sha256 "$PTAU_FILE" | awk '{print $2}')
fi

if [ "$EXPECTED_SHA256" = "REPLACE_WITH_TRUSTED_SHA256" ]; then
	echo "WARNING: PTAU checksum not configured. Set EXPECTED_SHA256 in this script to enforce verification."
else
	if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
		echo "PTau checksum mismatch (got $ACTUAL_SHA256, expected $EXPECTED_SHA256). Removing file and aborting."
		rm -f "$PTAU_FILE"
		exit 2
	fi
fi

if [ ! -f square_final.zkey ]; then
	echo "Setting up zkey..."
	snarkjs groth16 setup square.r1cs powersOfTau28_hez_final_10.ptau square_0000.zkey
	snarkjs zkey contribute square_0000.zkey square_final.zkey --name="build-and-contribute" -v
	snarkjs zkey export verificationkey square_final.zkey verification_key.json
fi

if [ -f square_final.zkey ]; then
	echo "Exporting solidity verifier..."
	snarkjs zkey export solidityverifier square_final.zkey ../../contracts/Verifier.sol
fi

cd "$ROOT"

if [ -f contracts/Verifier.sol ]; then
	echo "Starting hardhat node in background..."
	npx hardhat node --hostname 127.0.0.1 &
	HH_PID=$!
	sleep 3
	npx hardhat run --network localhost scripts/deploy.js
	echo "Hardhat node PID: $HH_PID"
fi

if [ -f circuits/build/square.wasm ]; then
	echo "Generating proof (example input=5)"
	node scripts/generate_proof.js 5 || true
fi

echo "Running tests..."
npm test --silent

echo "CI run complete. Artifacts: circuits/build and contracts/Verifier.sol"
