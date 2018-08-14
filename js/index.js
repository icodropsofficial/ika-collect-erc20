window.addEventListener("load", function() {
  var Web3 = require("web3");
  var web3 = new Web3("http://127.0.0.1:8545");

  var plus = document.getElementById("add");
  var setAllAmount = document.getElementById("setall-amount-btn");
  var setAllFee = document.getElementById("setall-fee-btn");
  var form = document.getElementById("config");
  var keyEl = document.getElementsByName("privkey")[0];

  const updateNonce = () => {
    key = getKey(keyEl.value);
    if (!key) {
      return
    }

    web3.eth.getTransactionCount(web3.eth.accounts.privateKeyToAccount(`${key}`).address).then(count => {
      document.getElementsByName("nonce")[0].value = count;
    });
  };

  const updateBalance = () => {
    key = getKey(keyEl.value);
    if (!key) {
      return
    }

    web3.eth.getBalance(web3.eth.accounts.privateKeyToAccount(`${key}`).address).then(balance => {
      document.getElementById("balance").innerText = `ETH: ${web3.utils.fromWei(balance, "ether")}`;
    });
  }

  const updateAll = () => {
    updateNonce();
    updateBalance();
  }

  form.onsubmit = () => {
    sendEth(web3, updateBalance);

    return false;
  };

  keyEl.addEventListener("input", updateAll);
  document.getElementById("recalculate").addEventListener("click", updateAll);


  plus.addEventListener("click", () => {
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
      <input type="number" class="card amount" placeholder="amount (eth)" name="amount" step="0.00000001" min="0" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card fee" placeholder="fee (gwei)" name="fee" step="1" min="0" required />
      </div>

      <div class="col-md-2 middle">
      <span class="middle">
      </span>
      </div>
      `;

    var form = document.getElementById("config");

    form.insertBefore(row, plus.parentElement.parentElement);

    var removes = document.getElementsByClassName("remove");
    removes[removes.length-1].addEventListener("click", () => {
      row.className += " fade-out";
      window.setTimeout(() => {
        form.removeChild(row);
      }, 290);
    });

    return false;
  });

  setAllAmount.addEventListener("click", () => {
    var amount = document.getElementById("setall-amount").value;
    var amounts = document.querySelectorAll(".amount:not(.success)");

    for (var i = 0; i < amounts.length; i++) {
      amounts[i].value = amount;
    }

    return false;
  });

  setAllFee.addEventListener("click", () => {
    var fee = document.getElementById("setall-fee").value;
    var fees = document.querySelectorAll(".fee:not(.success)");

    for (var i = 0; i < fees.length; i++) {
      fees[i].value = fee;
    }

    return false;
  });

  makeCollapsible();
});

function sendEth(web3, updateBalance) {
  getInputData().then(data => {
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
          var tx = new Tx();
          tx.gasPrice = new BN(web3.utils.toWei(txn.fee, "shannon"));
          tx.gasLimit = 21000;
          tx.value = new BN(web3.utils.toWei(txn.amount, "ether"));
          tx.to = txn.address;
          tx.nonce = count++;
          tx.sign(privateKey);

          var serializedTx = tx.serialize();

          confirmations[txn.address] = 0;

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
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://rinkeby.etherscan.io/tx/${r.transactionHash}"><img src="${cross}" alt="${e}" width="24" height="24"></a>`;
  }

  if (wallet.children.length == 4) {
    for (var i = 0; i <= 2; i++) {
      wallet.children[i].firstElementChild.className += " fail";
    }
  } else {
    for (var i = 1; i <= 3; i++) {
      wallet.children[i].firstElementChild.className += " fail";
    }
  }
}

function showReceipt(r, address) {
  if (r.status) {
    const tick = require("../img/external-link-alt-solid.svg");
    var wallet = getWalletByAddress(address);
    // TODO: change to mainnet
    wallet.lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://rinkeby.etherscan.io/tx/${r.transactionHash}"><img src="${tick}" alt="success, click to view on Etherscan" width="24" height="24"></a>`;
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
    getWalletByAddress(address).lastElementChild.lastElementChild.innerHTML = `<a rel="noopener" target="_blank" class="receipt" href="https://rinkeby.etherscan.io/tx/${r.transactionHash}"><img width="24" height="24" src="${cross}" alt=""></a>`;
  }
}

function setWaiting() {
  const clock = require("../img/clock-solid.svg");
  document.querySelectorAll(".wallet:not(.success)").forEach(el => {
    el.lastElementChild.lastElementChild.innerHTML = `<img src="${clock}" alt="sending..." width="24" height="24">`;
  });
}

function getInputData() {
  return new Promise(resolve => {
    var data = new FormData(document.getElementById("config"));
    var parsed = {transactions: []};
    var txn = {};

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
    }

    parsed.transactions.push(txn);
    resolve(parsed);
  });
}

function getWalletByAddress(address) {
  var nodes = document.querySelectorAll("input.address");
  for (var i = 0; i < nodes.length; i++) {
    console.log(nodes[i].value);
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
