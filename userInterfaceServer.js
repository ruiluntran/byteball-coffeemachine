'use strict';
const walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const config = require('./conf');
const port = 3001;
app.use(express.static('userInterface'));

const io = require('socket.io')(http);

let wallet;

app.get('/',(req, res) => {
  res.sendFile('./userInterface/index.html');
});

app.get('/settings', (req, res) => {
  res.json({
    prices: {
      normal: config.NormalCoffeePrice,
      strong: config.StrongCoffeePrice,
    },
    assetId: config.boschCoinAssetId
  })
});

app.post('/newAddress',(req, res) => {
  walletDefinedByKeys.issueNextAddress(wallet,0,(objAddress) => {
    res.send(objAddress.address);
  });
});


http.listen(port, function () {
  console.log('User interface app listening on port ' + port);
});


module.exports = {

  generatedNewAddress: (address)=>{
    io.emit('generatedNewAddress', {data: address});
  },
  coffeePaid: () => {
    io.emit('coffeePaid',{});
  },
  setWallet: (_wallet) => {
    wallet = _wallet
  }


};