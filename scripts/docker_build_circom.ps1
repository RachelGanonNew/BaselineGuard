Param(
  [string]$InputCircuit = 'circuits/square.circom'
)

Write-Host "Using Docker to compile $InputCircuit"
$pwd = (Get-Location).Path
docker run --rm -v "${pwd}:/work" -w /work iden3/circom:latest circom $InputCircuit --r1cs --wasm --sym -o circuits/build
Write-Host "Done. Artifacts in circuits/build"
