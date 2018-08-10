window.addEventListener("load", function() {
  var Web3 = require("web3");
  var web3 = new Web3("https://rinkeby.infura.io/v3/84e0a3375afd4f57b4753d39188311d7");

  var plus = document.getElementById("add");
  var setAll = document.getElementById("setall");
  var form = document.getElementById("config");

  //document.getElementById("send").addEventListener("click", () => {
    //sendEth(web3);
  //});

  plus.addEventListener("click", () => {
    var row = document.createElement("div");
    row.className = "wallet cards row";
    row.innerHTML = `
      <div class="col-md-6">
      <input type="text" class="card address" placeholder="ETH address (0x012345...)" name="address" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card amount" placeholder="amount (eth)" name="amount" step="0.00000001" min="0" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card fee" placeholder="fee (gwei)" name="fee" step="1" min="0" />
      </div>

      <div class="col-md-2 middle">
      <span class="middle">
      ⚙️
      </span>
      </div>
      `;

    document.getElementById("config").insertBefore(row, plus.parentElement.parentElement);

    return false;
  });

  setAll.addEventListener("click", () => {
    var amount = document.getElementById("setall-amount").value;
    var fee = document.getElementById("setall-fee").value;

    var amounts = document.getElementsByClassName("amount");
    var fees = document.getElementsByClassName("fee");

    for (var i = 0; i < amounts.length; i++) {
      amounts[i].value = amount;
      fees[i].value = fee;
    }

    return false;
  });
});

function sendEth(web3) {
  getInputData().then(data => {
    if (data.privKey.startsWith("0x")) {
      data.privKey = data.privKey.slice(2);
    }

    var BN = web3.utils.BN;
    var Tx = require('ethereumjs-tx');
    var privateKey = new Buffer(data.privKey, 'hex')

    web3.eth.getTransactionCount(web3.eth.accounts.privateKeyToAccount(`0x${data.privKey}`).address).then(count => {
      data.addrs.forEach((address, i, a) => {
        if (web3.utils.isAddress(address)) {
          var tx = new Tx();
          tx.gasPrice = new BN(web3.utils.toWei("12", "shannon"));
          tx.gasLimit = 21000;
          tx.value = new BN(web3.utils.toWei("0.001", "ether"));
          tx.to = address;
          tx.nonce = count++;
          tx.sign(privateKey);

          var serializedTx = tx.serialize();

          web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', console.log).on("error", console.log);
        } else {
          console.log(`${address} is not a valid Ethereum address!!!!`);
        }
      });
    });
  });
}

function next(web3js, reqs) {
  var batch = web3.createBatch();
  batch.add(reqs[0]);
  batch.execute();
}

function getInputData() {
  return new Promise(resolve => {
    var key = document.getElementById("key").value;

    var inputs = [];
    var arr = document.getElementsByClassName("dest");

    for (var i = 0; i < arr.length; i++) {
      inputs.push(arr[i].value);

      if (i == arr.length - 1) {
        resolve({privKey: key, addrs: inputs});
      }
    }
  });
}
