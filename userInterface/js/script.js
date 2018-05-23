var socket = io();
var qrCodeWidth;

$(document).ready(function () {
  qrCodeWidth = ($(window).width() / 2) - 40;
});

var activeButtonClass = 'active';
var button = $('button');

$('#coffee-normal').addClass(activeButtonClass);

socket.on('generatedNewAddress', function(msg){
  generateNewQRcode(msg.data);
});

socket.on('coffeePaid', function(){
  alert('Coffee paid');
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
