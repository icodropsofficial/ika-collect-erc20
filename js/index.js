window.addEventListener("load", function() {
  var Web3 = require("web3");
  var web3 = new Web3("https://ropsten.infura.io/v3/84e0a3375afd4f57b4753d39188311d7");

  document.getElementById("send").addEventListener("click", () => {
    sendEth(web3);
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
          tx.gasPrice = web3.utils.toWei(new BN(12), "shannon");
          tx.gasLimit = 21000;
          tx.value = web3.utils.toWei(new BN(0.001), "ether");
          tx.to = address;
          tx.nonce = ++count;
          tx.sign(privateKey);

          var serializedTx = tx.serialize();

          web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', console.log);
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
