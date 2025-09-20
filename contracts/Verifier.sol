// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Verifier {
    // This file will be overwritten by snarkjs zkey export solidityverifier
    // Placeholder fallback to avoid compilation errors if not generated yet.
    function verifyProof(bytes memory, uint[1] memory) public pure returns (bool) {
        return false;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Placeholder: the real verifier will be exported by snarkjs into this file.
contract Verifier {
    // the final generated verifier will replace this contract
    function verifyProof(bytes memory /*proof*/, uint[] memory /*pubSignals*/) public pure returns (bool) {
        return true;
    }
}
