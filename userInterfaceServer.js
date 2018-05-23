'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const config = require('./conf');

const port = 3001;
app.use(express.static('userInterface'));


const io = require('socket.io')(http);

app.get('/',(req, res) => {
  res.sendFile('./userInterface/index.html');
});

app.get('/prices', (req, res) => {
  res.json({
    normal: config.NormalCoffeePrice,
    strong: config.StrongCoffeePrice
  })
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
  }


};