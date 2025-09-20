// pragma removed as workaround for parser issues in some circom npm builds
template Square() {
    signal input in;
    signal output out;

    out <== in * in;
}

component main = Square();
