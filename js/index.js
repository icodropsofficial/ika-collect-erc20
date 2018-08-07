window.addEventListener("load", function() {
  var Web3 = require("web3");
  var web3 = new Web3("https://api.myetherwallet.com/rop");

  document.getElementById("send").addEventListener("click", () => {
    sendEth(web3);
  });
});

function sendEth(web3) {
  getInputData().then(data => {
    var batch = new web3.BatchRequest();;
    var BN = web3.utils.BN;

    data.addrs.forEach((address, i, a) => {
      if (web3.utils.isAddress(address)) {
        web3.eth.accounts.signTransaction({to: address,
          value: web3.utils.toWei(new BN("0.001"), "ether"),
          gasPrice: web3.utils.toWei(new BN(8), "gwei"), gas: 21000},
          data.privKey).then(tx => {
            batch.add(web3.eth.sendSignedTransaction.request(tx.rawTransaction, (err, hash) => {
              console.log(err, hash);
            }));
        });
      } else {
        console.log(`${address} is not a valid Ethereum address!!!!`);
      }

      if (i == a.length - 1) {
        batch.execute();
      }
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
