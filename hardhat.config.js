require('@nomicfoundation/hardhat-toolbox');
const path = require('path');

module.exports = {
  solidity: '0.8.18',
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts'
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    }
  }
};
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: '0.8.18',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    }
  }
};
