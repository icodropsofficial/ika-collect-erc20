'use strict';

window.addEventListener("load", main);

function main() {
  var Web3 = require("web3");
  var web3 = new Web3("https://rinkeby.infura.io/v3/84e0a3375afd4f57b4753d39188311d7");

  var plusEl = document.getElementById("add");
  var setAllAmountEl = document.getElementById("setall-amount-btn");
  var setAllFeeEl = document.getElementById("setall-fee-btn");
  var formEl = document.getElementById("config");
  var firstWalletEl = document.getElementsByClassName("wallet")[0];

  var keyEl = document.getElementsByName("privkey")[0];
  var contractEl = document.getElementsByName("contract")[0];
  var tokenEl = document.getElementById("token");

  var key = "";
  var address = "";
  var contract = {};
  var token = {};

  const updateKey = () => {
    key = getKey(keyEl.value);
    return !key ? false : true;
  }

  const updateAddress = () => {
    address = web3.eth.accounts.privateKeyToAccount(`${key}`).address;
  }

  const updateNonce = () => {
    web3.eth.getTransactionCount(address).then(count => {
      document.getElementsByName("nonce")[0].value = count;
    });
  };

  const updateBalance = () => {
    web3.eth.getBalance(address).then(balance => {
      return new Promise(resolve => {
        document.getElementById("balance").innerText = `ETH: ${web3.utils.fromWei(balance, "ether")}`;
        resolve();
      });
    }).then(() => {
      if (Object.keys(token).length === 0) {
        return;
      }

      var bal = 0;
      contract.methods.balanceOf(address).call().then(tokenBalance => {
        bal = tokenBalance;
        document.getElementById("balance").innerText += `, tokens: ${bal / 10 ** token.decimals}`;
      });
    });
  };

  const updateKeyBalance = () => {
    if (!updateKey()) return;
    updateAddress();
    updateBalance();
  };

  const updateAll = () => {
    if (!updateKey()) return;
    updateAddress();
    updateNonce();
    updateBalance();
  }

  const updateGas = () => {
    web3.eth.getGasPrice().then(price => {
      document.getElementById("gasprice").innerText = `suggested gas price: ${parseFloat(web3.utils.fromWei(price, "gwei")).toFixed(2)} gwei`;
    });
  };

  formEl.onsubmit = () => {
    sendEth(web3, updateKeyBalance, contract, token);

    return false;
  };

  keyEl.addEventListener("input", updateAll);
  document.getElementById("recalculate").addEventListener("click", updateAll);


  plusEl.addEventListener("click", () => {
    var row = document.createElement("div");
    row.className = "wallet cards row";
    row.innerHTML = `
      <div class="col-md-1">
      <button class="card remove" type="button">-</button>
      </div>

      <div class="col-md-5">
      <input type="text" class="card address" placeholder="ETH address (0x012345...)" name="address" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card amount" placeholder="eth" name="amount" step="0.00000001" min="0" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card fee" placeholder="fee (gwei)" name="fee" step="1" min="0" required />
      </div>

      <div class="col-md-2 middle">
      <span class="middle">
      </span>
      </div>
      `;

    formEl.insertBefore(row, plusEl.parentElement.parentElement);

    var removes = document.getElementsByClassName("remove");
    removes[removes.length-1].addEventListener("click", () => {
      row.className += " fade-out";
      window.setTimeout(() => {
        formEl.removeChild(row);
      }, 290);
    });

    var inp = row.children[1].firstElementChild;
    inp.addEventListener("input", () => {
      if (Object.keys(contract).length !== 0 && web3.utils.isAddress(inp.value)) {
        contract.methods.balanceOf(inp.value).call().then(bal => {
          row.children[2].firstElementChild.placeholder = bal / 10 ** token.decimals;
        });
      }
    });

    return false;
  });


  firstWalletEl.firstElementChild.firstElementChild.addEventListener("input", () => {
      if (Object.keys(contract).length !== 0 && web3.utils.isAddress(firstWalletEl.firstElementChild.firstElementChild.value)) {
        contract.methods.balanceOf(firstWalletEl.firstElementChild.firstElementChild.value).call().then(bal => {
          firstWalletEl.children[1].firstElementChild.placeholder = bal / 10 ** token.decimals;
        });
      }
  });

  setAllAmountEl.addEventListener("click", () => {
    var amount = document.getElementById("setall-amount").value;
    var amounts = document.querySelectorAll(".amount:not(.success)");

    for (var i = 0; i < amounts.length; i++) {
      amounts[i].value = amount;
    }

    return false;
  });

  setAllFeeEl.addEventListener("click", () => {
    var fee = document.getElementById("setall-fee").value;
    var fees = document.querySelectorAll(".fee:not(.success)");

    for (var i = 0; i < fees.length; i++) {
      fees[i].value = fee;
    }

    return false;
  });

  import("./tokens.js").then(tokens => {
    contractEl.addEventListener("input", () => {
      addr = contractEl.value.trim();
      if (web3.utils.isAddress(addr)) {
        tokens.updateTokenData(addr, web3).then(val => {
          contract = val[0];
          token = val[1];
          updateTokenInfo(token, tokenEl);
          updateKeyBalance();
        });
      } else {
        document.getElementById("token").innerText = "invalid token contract address";
      }
    });
  });

  makeCollapsible();

  updateGas();
  window.setInterval(updateGas, 5000);
}

function sendEth(web3, updateBalance, contract, token) {
  getInputData().then(data => {
    if (data == undefined || data.transactions.length == 0) {
      return;
    }
    var confirmations = {};
    if (data.privkey.startsWith("0x")) {
      data.privkey = data.privkey.slice(2);
    }

    var BN = web3.utils.BN;
    var Tx = require('ethereumjs-tx');
    var privateKey = new Buffer(data.privkey, 'hex');

    setWaiting();

    var delay = 0;
    count = parseInt(data.nonce);

    data.transactions.forEach((txn, i, a) => {
      // XXX: to reduce nonce on fail
      window.setTimeout(() => {
        if (web3.utils.isAddress(txn.address)) {
          var call = contract.methods.transfer(txn.address, txn.amount * 10 ** token.decimals);

          var tx = new Tx();
          tx.gasPrice = new BN(web3.utils.toWei(txn.fee, "shannon"));
          tx.value = 0;
          tx.to = contract._address;
          tx.nonce = count++;
          tx.data = call.encodeABI();

          tx.gasLimit = new BN(tx.getBaseFee());

          tx.sign(privateKey);
          var serializedTx = tx.serialize();

          web3.eth.estimateGas(web3.eth.sendSignedTransaction.request('0x' + serializedTx.toString('hex'))).then(gas => {
            console.log(gas);
            tx.gasLimit = gas;

            tx.sign(privateKey);
            serializedTx = tx.serialize();

            web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
              .on('receipt', (r) => {
                console.log(r);
                showReceipt(r, txn.address);
                updateBalance();
              }).on("error", (e, r) => {
                console.log(e);
                count--;
                showError(e, txn.address, r);
              });

            if (i == a.length - 1) {
              window.setTimeout(() => {
                document.getElementsByName("nonce")[0].value = count;
              }, 100);
            }
          });
        } else {
          showError(`${txn.address} is not a valid Ethereum address!!!!`, txn.address, null);
        }
      }, delay++ * 400);
    });
  });
}

function showError(e, address, r) {
  const cross = require("../img/times-circle-regular.svg");

  var wallet = getWalletByAddress(address);
  if (!r) {
    wallet.lastElementChild.lastElementChild.innerHTML = `<img src="${cross}" alt="${e}" width="24" height="24">`;
    wallet.lastElementChild.lastElementChild.title = e;
  } else {
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><img src="${cross}" alt="${e}" width="24" height="24"></a>`;
  }

  if (wallet.children.length == 4) {
    for (var i = 0; i <= 2; i++) {
      wallet.children[i].firstElementChild.className += " fail";
        wallet.children[i].firstElementChild.required = true;
        wallet.children[i].firstElementChild.disabled = false;
    }
  } else {
    for (var i = 1; i <= 3; i++) {
      wallet.children[i].firstElementChild.className += " fail";
        wallet.children[i].firstElementChild.required = true;
        wallet.children[i].firstElementChild.disabled = false;
    }
  }
}

function showReceipt(r, address) {
  if (r.status) {
    const tick = require("../img/external-link-alt-solid.svg");
    var wallet = getWalletByAddress(address);
    // TODO: change to mainnet
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><img src="${tick}" alt="success, click to view on Etherscan" width="24" height="24"></a>`;
    wallet.lastElementChild.lastElementChild.title = "success, click to view on Etherscan";
    if (wallet.children.length == 4) {
      for (var i = 0; i <= 2; i++) {
        wallet.children[i].firstElementChild.required = "false";
        wallet.children[i].firstElementChild.disabled = "true";
        wallet.children[i].firstElementChild.className += " success";
      }
    } else {
      for (var i = 1; i <= 3; i++) {
        wallet.children[i].firstElementChild.required = "false";
        wallet.children[i].firstElementChild.disabled = "true";
        wallet.children[i].firstElementChild.className += " success";
      }
    }
    wallet.className += " success";
  } else {
    const cross = require("../img/times-circle-regular.svg");
    getWalletByAddress(address).lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><img width="24" height="24" src="${cross}" alt=""></a>`;
  }
}

function setWaiting() {
  const clock = require("../img/clock-solid.svg");
  document.querySelectorAll(".address:not([disabled])").forEach(childEl => {
    el = childEl.parentElement.parentElement;
    el.lastElementChild.lastElementChild.innerHTML = `<img src="${clock}" alt="sending..." width="24" height="24">`;

    if (el.children.length == 4) {
      for (var i = 0; i <= 2; i++) {
        el.children[i].firstElementChild.required = "false";
        el.children[i].firstElementChild.disabled = "true";
      }
    } else {
      for (var i = 1; i <= 3; i++) {
        el.children[i].firstElementChild.required = "false";
        el.children[i].firstElementChild.disabled = "true";
      }
    }
  });
}

function getInputData() {
  return new Promise(resolve => {
    var data = new FormData(document.getElementById("config"));
    var parsed = {transactions: []};
    var txn = {};
    var addrs = {};

    var i = 0;
    for (var pair of data) {
      if (pair[1] == "") {
        continue;
      }

      if (["address", "amount", "fee"].includes(pair[0])) {
        if (pair[0] == "address" && Object.keys(txn).length != 0) {
          parsed.transactions.push(txn);
          txn = {};
        }

        txn[pair[0]] = pair[1];
      } else {
        parsed[pair[0]] = pair[1];
      }

      if (pair[0] == "address") {
        addrs[pair[1]] == undefined ? addrs[pair[1]] = 1 : addrs[pair[1]] += 1;
      }
    }

    for (var addr in addrs) {
      if (addrs[addr] && addrs[addr] > 1) {
        alert(`found a duplicate entry: ${addr}, please remove one first`);
        resolve(undefined);
      }
    }

    if (txn.address != undefined) {
      parsed.transactions.push(txn);
    }
    resolve(parsed);
  });
}

function getWalletByAddress(address) {
  var nodes = document.querySelectorAll("input.address:not(.success)");
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].value == address) {
      return nodes[i].parentElement.parentElement;
    }
  }
  return document.createElement("input");
}

/**
 * Makes a div with a link with class "collapsible" collapsible.
 * The div must have no class and must have exactly two children: a link and
 * a div with no class.
 *
 * The link also has to have a span with a + inside.
 */
function makeCollapsible() {
  var els = document.getElementsByClassName("collapsible");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];

    el.parentElement.className += "collapsible-container";

    el.addEventListener("click", () => {
      if (el.parentElement.lastElementChild.className == "collapsed") {
        el.parentElement.lastElementChild.className = "fade-in";
        el.firstElementChild.innerText = "-";
      } else {
        el.parentElement.lastElementChild.className = "fade-out";
        window.setTimeout(() => {
          el.parentElement.lastElementChild.className = "collapsed";
        }, 290);
        el.firstElementChild.innerText = "+";
      }
    });
  }
}

function getKey(key) {
  if (!key.startsWith("0x")) {
    key = "0x" + key;
  }
  if (key.length != 66) {
    return false;
  }

  return key;
}

function updateTokenInfo(token, tokenEl) {
  tokenEl.innerText = `${token.symbol}: ${token.name}, ${token.decimals} decimals`;
}
