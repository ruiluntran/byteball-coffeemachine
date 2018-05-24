var socket = io();
var qrCodeWidth;

var prices;

$(document).ready(function () {
  qrCodeWidth = ($(window).width() / 2) - 40;

  $.get('/prices', function (data) {
    prices = data;
    $('#coffee-normal').addClass(activeButtonClass);
    setPrice(prices.normal);
  })

});

var activeButtonClass = 'active';
var button = $('button');

socket.on('generatedNewAddress', function (msg) {
  selectCoffeeType(msg.type, false);
  generateNewQRcode(msg.address);
});

socket.on('coffeePaid', function(){
  alert('Coffee paid');

  // show loading 70000ms
});

button.on('click', function () {
  selectCoffeeType(this.id, true);
});


function generateNewQRcode(content) {
  $('#qrcode').html("");
  new QRCode('qrcode', {
    text: 'byteball:'+content,
    width: qrCodeWidth,
    height: qrCodeWidth,
    colorDark: "#EC1B24",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function selectCoffeeType(type, emit) {

  var buttonId = '#' + type;

  switch (type){
    case 'normal':
      setPrice(prices.normal);
      break;
    case 'strong':
      setPrice(prices.strong);
      break;
  }
  if(emit){
    socket.emit('newOrder', {type: 'normal'});
  }

  button.removeClass(activeButtonClass);
  $(buttonId).addClass(activeButtonClass);
}

function setPrice(price) {
  $('#price').text(price);
}