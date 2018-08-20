'use strict';

const abi = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  }
];

export function updateTokenData(addr, web3) {
  return new Promise(resolve => {
    var contract = new web3.eth.Contract(abi, addr);
    var tokenInfo = {};

    contract.methods.symbol().call().then(sym => {
      tokenInfo["symbol"] = sym;
      return contract.methods.name().call();
    }).then(name => {
      tokenInfo["name"] = name;
      return contract.methods.decimals().call();
    }).then(decimals => {
      tokenInfo["decimals"] = decimals;
    }).then(() => {
      resolve([contract, tokenInfo]);
    });
  });
}

