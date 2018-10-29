'use strict';

var fs = require("fs");
var themes = require("./themes.json");

var currentTheme = window.localStorage.getItem("theme");

if (themes[currentTheme] != undefined) {
  setTheme(currentTheme);
} else {
  setTheme("day");
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

function main() {
  var Web3 = require("web3");
  var web3 = new Web3("https://rinkeby.infura.io/v3/84e0a3375afd4f57b4753d39188311d7");
  var hexa = /^0x[0-9A-F]+$/i;

  var plusEl = document.getElementById("add");
  var setAllAmountEl = document.getElementById("setall-amount-btn");
  var setAllFeeEl = document.getElementById("setall-fee-btn");
  var formEl = document.getElementById("config");
  var firstWalletEl = document.getElementsByClassName("wallet")[0];

  var targetEl = document.getElementsByName("target")[0];
  var contractEl = document.getElementsByName("contract")[0];
  var tokenEl = document.getElementById("token");

  var switchEl = document.getElementById("theme-switch");
  switchEl.firstElementChild.className = window.localStorage.getItem("theme");

  var address = "";
  var contract = {};
  var token = {};

  const updateAddress = () => {
    address = targetEl.value;
    if (!web3.utils.isAddress(address)) {
      address = "";
      return false;
    }

    return true;
  }

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
        document.getElementById("token-balance").innerHTML = `${token.symbol}: ${bal / 10 ** token.decimals}`;
      });
    });
  };

  const updateAll = () => {
    if (!updateAddress()) return;
    updateBalance();
  }

  const updateGas = () => {
    web3.eth.getGasPrice().then(price => {
      document.getElementById("gasprice").innerText = `suggested gas price: ${parseFloat(web3.utils.fromWei(price, "gwei")).toFixed(2)} gwei`;
    });
  };

  formEl.onsubmit = () => {
    sendEth(web3, updateAll, contract, token);

    return false;
  };

  targetEl.addEventListener("input", updateAll);

  plusEl.addEventListener("click", () => {
    var row = document.createElement("div");
    row.className = "wallet cards row";
    row.innerHTML = `
      <div class="col-md-1">
      <button class="card remove" type="button">–</button>
      </div>

      <div class="col-md-5">
      <input type="text" class="card address" placeholder="private key (0x012345...)" name="privkey" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card amount" placeholder="tokens" name="amount" step="0.00000001" min="0" required />
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
      if (Object.keys(contract).length !== 0 && getKey(inp.value).length == 66) {
        var address = web3.eth.accounts.privateKeyToAccount(getKey(inp.value)).address;
        var addrDisplay = document.createElement("div");
        addrDisplay.className = "col-md-5";
        var addr = document.createElement("p");
        addr.innerText = address;
        addr.className = "converted";
        addrDisplay.appendChild(addr);

        inp.className += " flipOut";
        window.setTimeout(() => {
          inp.parentElement.style.display = "none";
          row.insertBefore(addrDisplay, row.children[1]);

          contract.methods.balanceOf(address).call().then(bal => {
            row.children[3].firstElementChild.placeholder = (bal / 10 ** token.decimals).toFixed(2).toString();
          });
        }, 600);
      }
    });

    return false;
  });


  firstWalletEl.firstElementChild.firstElementChild.addEventListener("input", () => {
      if (Object.keys(contract).length !== 0 && getKey(firstWalletEl.firstElementChild.firstElementChild.value).length == 66) {
        var address = web3.eth.accounts.privateKeyToAccount(getKey(firstWalletEl.firstElementChild.firstElementChild.value)).address;
        var addrDisplay = document.createElement("div");
        addrDisplay.className = "col-md-6";
        var addr = document.createElement("p");
        addr.innerText = address;
        addr.className = "converted";
        addrDisplay.appendChild(addr);

        firstWalletEl.firstElementChild.className += " flipOut";
        window.setTimeout(() => {
          firstWalletEl.firstElementChild.style.display = "none";
          firstWalletEl.insertBefore(addrDisplay, firstWalletEl.firstElementChild);

          contract.methods.balanceOf(address).call().then(bal => {
            firstWalletEl.children[2].firstElementChild.placeholder = (bal / 10 ** token.decimals).toFixed(2).toString();
          });
        }, 600);
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
          updateAll();
        });
      } else {
        document.getElementById("token").innerText = "invalid token contract address";
      }
    });
  });

  switchEl.addEventListener("click", () => {
    if (window.localStorage.getItem("theme") == "day") {
      setTheme("night");
      switchEl.firstElementChild.className = "night";
    } else {
      setTheme("day");
      switchEl.firstElementChild.className = "day";
    }
  });

  makeCollapsible();
  addTosModal();

  updateGas();
  window.setInterval(updateGas, 5000);
}

function setTheme(theme) {

  window.localStorage.setItem("theme", theme);

  Object.keys(themes[theme]).forEach(k => {
    document.body.style.setProperty(k, themes[theme][k]);
  });
}

function sendEth(web3, updateBalance, contract, token) {
  getInputData().then(data => {
    if (data == undefined || data.transactions.length == 0) {
      return;
    }

    var hexa = /^[0-9A-F]+$/i;

    var BN = web3.utils.BN;
    var Tx = require('ethereumjs-tx');

    setWaiting();

    data.transactions.forEach((txn, i, a) => {
      var origKey = txn.privkey;
      txn.privkey = getKey(txn.privkey);
      if (!hexa.test(txn.privkey.slice(2))) {
        showError(`${txn.privkey} is not a valid Ethereum private key!!!!`, txn.privkey, null);
        return;
      }
      var privateKey = new Buffer(txn.privkey.slice(2), 'hex');

      web3.eth.getTransactionCount(web3.eth.accounts.privateKeyToAccount(txn.privkey).address).then(count => {
        var call = contract.methods.transfer(data.target, txn.amount * 10 ** token.decimals);

        var tx = new Tx();
        tx.gasPrice = new BN(web3.utils.toWei(txn.fee, "shannon"));
        tx.value = 0;
        tx.to = contract._address;
        tx.nonce = count;
        tx.data = call.encodeABI();

        tx.gasLimit = new BN(data.gas);

        tx.sign(privateKey);
        var serializedTx = tx.serialize();


        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
          .on("receipt", (r) => {
            console.log(r);
            showReceipt(r, origKey);
            updateBalance();
          }).on("error", (e, r) => {
            console.log(e);
            count--;
            showError(e, origKey, r);
          });
      });

    });
  });
}

function showError(e, address, r) {
  const cross = fs.readFileSync("img/failed.svg", "utf8");

  var wallet = getWalletByAddress(address);
  if (!r) {
    wallet.lastElementChild.lastElementChild.innerHTML = `<div class="icon middle">${cross}</div>`;
    wallet.lastElementChild.lastElementChild.title = e;
  } else {
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><div class="icon middle" alt="${e}">${cross}</div></a>`;
  }

  if (wallet.children.length == 5) {
    for (var i = 0; i <= 3; i++) {
      wallet.children[i].firstElementChild.className += " fail";
        wallet.children[i].firstElementChild.required = true;
        wallet.children[i].firstElementChild.disabled = false;
    }
  } else {
    for (var i = 1; i <= 4; i++) {
      wallet.children[i].firstElementChild.className += " fail";
        wallet.children[i].firstElementChild.required = true;
        wallet.children[i].firstElementChild.disabled = false;
    }
  }
}

function showReceipt(r, address) {
  if (r.status) {
    const tick = fs.readFileSync("img/external-link.svg", "utf8");
    var wallet = getWalletByAddress(address);
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><div class="icon middle">${tick}</div></a>`;
    wallet.lastElementChild.lastElementChild.title = "success, click to view on Etherscan";
    if (wallet.children.length == 5) {
      for (var i = 0; i <= 3; i++) {
        wallet.children[i].firstElementChild.required = "false";
        wallet.children[i].firstElementChild.disabled = "true";
        wallet.children[i].firstElementChild.className += " success";
      }
    } else {
      for (var i = 1; i <= 4; i++) {
        wallet.children[i].firstElementChild.required = "false";
        wallet.children[i].firstElementChild.disabled = "true";
        wallet.children[i].firstElementChild.className += " success";
      }
    }
    wallet.className += " success";
  } else {
    const cross = fs.readFileSync("img/failed.svg", "utf8");
    getWalletByAddress(address).lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://etherscan.io/tx/${r.transactionHash}"><div class="icon">${cross}</div></a>`;
  }
}

function setWaiting() {
  const clock = fs.readFileSync("img/loading.svg", "utf8");
  document.querySelectorAll(".address:not([disabled])").forEach(childEl => {
    el = childEl.parentElement.parentElement;
    el.lastElementChild.lastElementChild.innerHTML = `<div class="icon spin middle">${clock}</div>`;

    if (el.children.length == 5) {
      for (var i = 0; i <= 3; i++) {
        el.children[i].firstElementChild.required = "false";
        el.children[i].firstElementChild.disabled = "true";
      }
    } else {
      for (var i = 1; i <= 4; i++) {
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

      if (["privkey", "amount", "fee"].includes(pair[0])) {
        if (pair[0] == "privkey" && Object.keys(txn).length != 0) {
          parsed.transactions.push(txn);
          txn = {};
        }

        txn[pair[0]] = pair[1];
      } else {
        parsed[pair[0]] = pair[1];
      }

      if (pair[0] == "privkey") {
        addrs[pair[1]] == undefined ? addrs[pair[1]] = 1 : addrs[pair[1]] += 1;
      }
    }

    for (var addr in addrs) {
      if (addrs[addr] && addrs[addr] > 1) {
        alert(`found a duplicate entry: ${addr}, please remove one first`);
        resolve(undefined);
      }
    }

    if (txn.privkey != undefined) {
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
 */
function makeCollapsible() {
  var els = document.getElementsByClassName("collapsible");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];

    el.parentElement.className += "collapsible-container";

    el.addEventListener("click", () => {
      if (el.parentElement.lastElementChild.className == "collapsed") {
        el.parentElement.lastElementChild.className = "fade-in";
        el.className = "collapsible on";
      } else {
        el.parentElement.lastElementChild.className = "fade-out";
        window.setTimeout(() => {
          el.parentElement.lastElementChild.className = "collapsed";
        }, 290);
        el.className = "collapsible off";
      }
    });
  }
}

function getKey(key) {
  if (!key.startsWith("0x")) {
    key = "0x" + key;
  }

  return key;
}

function updateTokenInfo(token, tokenEl) {
  tokenEl.innerText = `${token.name} (${token.symbol}), ${token.decimals} decimals`;
}

function addTosModal() {
  var tingle = require("tingle.js");
  var tosEl = document.getElementById("tos");

  var modal = new tingle.modal({
    footer: true,
    closeMethods: ['overlay', 'escape']
  });

  modal.setContent(require("../disclaimer.html"));
  modal.addFooterBtn('done', 'card tos', function() {
    modal.close();
  });

  tosEl.onclick = () => {
    modal.open();
    return false;
  };
}
