'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = 3001;
app.use(express.static('userInterface'));


const io = require('socket.io')(http);

app.get('/',(req, res) => {
  res.sendFile('./userInterface/index.html');
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