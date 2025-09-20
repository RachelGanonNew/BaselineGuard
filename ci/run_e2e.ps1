<#
.SYNOPSIS
  Windows PowerShell helper to build Circom circuit, generate zkey/verifier, deploy locally and run tests.

  This script will try to use `npx circom` if available. If that fails and Docker daemon is running,
  you can instead run `npm run ci:docker` which executes the Linux flow inside a container.

  Run in an elevated PowerShell (if required) from the repo root:
    powershell -ExecutionPolicy Bypass -File .\ci\run_e2e.ps1
#>
param()
Set-StrictMode -Version Latest
Push-Location -LiteralPath (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)\..

Write-Output "Installing npm dependencies..."
npm ci

Write-Output "Ensuring snarkjs is available..."
npm i --no-audit --no-fund snarkjs@0.7.5

$buildDir = Join-Path -Path (Get-Location) -ChildPath 'circuits\build'
if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir | Out-Null }

Write-Output "Attempting to compile circuit via npx circom..."
try {
  & npx circom circuits/square.circom --r1cs --wasm --sym -o circuits/build
} catch {
  Write-Warning "npx circom failed or circom not installed."
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Output "Docker CLI found. Please ensure Docker Desktop is running and try `npm run ci:docker`."
  } else {
    Write-Error "Neither circom nor Docker are available. Install circom or start Docker Desktop."
  }
  Pop-Location
  exit 2
}

Set-Location -Path circuits\build
if (-not (Test-Path powersOfTau28_hez_final_10.ptau)) {
  Write-Output "Downloading ptau..."
  Invoke-WebRequest -Uri "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau" -OutFile powersOfTau28_hez_final_10.ptau
}

if (-not (Test-Path square_final.zkey)) {
  Write-Output "Running snarkjs zkey setup and contribution..."
  & snarkjs groth16 setup square.r1cs powersOfTau28_hez_final_10.ptau square_0000.zkey
  & snarkjs zkey contribute square_0000.zkey square_final.zkey --name="windows-contrib" -v
  & snarkjs zkey export verificationkey square_final.zkey verification_key.json
}

if (Test-Path square_final.zkey) {
  Write-Output "Exporting Solidity verifier to contracts/Verifier.sol"
  & snarkjs zkey export solidityverifier square_final.zkey ..\..\contracts\Verifier.sol
}

Pop-Location

if (Test-Path .\contracts\Verifier.sol) {
  Write-Output "Starting Hardhat node in background..."
  $hh = Start-Process -FilePath npx -ArgumentList 'hardhat node --hostname 127.0.0.1' -NoNewWindow -PassThru
  Start-Sleep -Seconds 4
  Write-Output "Deploying verifier to local node..."
  & npx hardhat run --network localhost scripts/deploy.js
  Write-Output "Hardhat node PID: $($hh.Id)"
}

if (Test-Path circuits\build\square.wasm) {
  Write-Output "Generating a sample proof (input=5)..."
  & node scripts/generate_proof.js 5
}

Write-Output "Running test suite..."
npm test --silent

Write-Output "CI helper finished. Artifacts are in circuits/build and contracts/Verifier.sol"
