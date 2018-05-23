var socket = io();
var qrCodeWidth;

var prices;

$(document).ready(function () {
  qrCodeWidth = ($(window).width() / 2) - 40;

  $.get('http://localhost:3001/prices', function (data) {
    prices = data;
    $('#coffee-normal').addClass(activeButtonClass);
    setPrice(prices.normal);
  })

});

var activeButtonClass = 'active';
var button = $('button');


socket.on('generatedNewAddress', function(msg){
  generateNewQRcode(msg.data);
});

socket.on('coffeePaid', function(){
  alert('Coffee paid');
});

button.on('click', function () {
  var buttonId = '#' + this.id;

  switch (this.id){
    case 'coffee-normal':
      setPrice(prices.normal);
      break;
    case 'coffee-strong':
      setPrice(prices.strong);
      break;
  }

  button.removeClass(activeButtonClass);
  $(buttonId).addClass(activeButtonClass);
});


function generateNewQRcode(content) {
  $('#qrcode').html("");
  new QRCode('qrcode', {
    text: content,
    width: qrCodeWidth,
    height: qrCodeWidth,
    colorDark: "#EC1B24",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function setPrice(price) {
  $('#price').text(price);
}