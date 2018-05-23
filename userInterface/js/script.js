var socket = io();
var qrCodeWidth;

$(document).ready(function () {
  qrCodeWidth = ($(window).width() / 2) - 40;
});

var activeButtonClass = 'active';
var button = $('button');

$('#coffee-normal').addClass(activeButtonClass);

socket.on('generatedNewAddress', function(msg){
  alert('New Address');
  generateNewQRcode(msg.data);
});

socket.on('coffeePaid', function(msg){
  alert('Coffee paid by ' + msg.data);
});

button.on('click', function () {
  var buttonId = '#' + this.id;
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
