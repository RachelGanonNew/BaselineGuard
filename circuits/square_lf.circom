// Simple circuit: prove that out = in * in without revealing in
pragma circom 2.0.0;

template Square() {
    signal input in;
    signal output out;

    out <== in * in;
}

component main = Square();
