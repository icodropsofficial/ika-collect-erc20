window.addEventListener('load', function() {
  var web3js
  if (typeof web3 !== 'undefined') {
    web3js = new Web3(web3.currentProvider);
    console.log("DAPP BROWSER DETECTED!!!!");

    document.getElementById("send").addEventListener("click", () => {
      sendEth(web3js);
    });

    web3js.eth.getAccounts((err, addrs) => {
      if (addrs.length == 0) {
        alert("unlock metamask first!");
      }
    });
  } else {
    web3js = new Web3(new Web3.providers.HttpProvider("https://api.myetherwallet.com/eth"));
    alert("install metamask");
  }
});

function sendEth(web3js) {
  getInputData().then(data => {
    var batch = [];

    data.forEach((address, i, a) => {
      if (web3.isAddress(address)) {
        var txn = web3js.eth.sendTransaction.request({to: address, value: web3.toWei(0.001, "ether"), gasPrice: web3js.toWei(8, "gwei")});
        txn.format = undefined;
        batch.push(txn);
      } else {
        console.log(`${address} is not a valid Ethereum address!!!!`);
      }

      if (i == a.length - 1) {
        web3js.currentProvider.sendAsync(batch, console.log);
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
    var inputs = [];

    var arr = document.getElementsByTagName("input");

    for (var i = 0; i < arr.length; i++) {
      inputs.push(arr[i].value);

      if (i == arr.length - 1) {
        resolve(inputs);
      }
    }
  });
}
