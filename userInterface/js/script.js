var socket = io();
var qrCodeWidth;

var prices;
var assetId;

$(document).ready(function () {
  qrCodeWidth = ($(window).width() / 2) - 40;

  $.get('/settings', function (data) {
    prices = data.prices;
    assetId = data.assetId;
    $('#normal').addClass(activeButtonClass);
    setPrice(prices.normal);
  })

});

var activeButtonClass = 'active';
var button = $('button');

socket.on('generatedNewAddress', function (msg) {
  selectCoffeeType(msg.type, false);
  generateNewQRcode(msg.address, msg.type);
});

socket.on('coffeePaid', function () {

  setLoadingModal(true);

  setTimeout(function () {
    setLoadingModal(false);
  }, 70 * 1000);

});

button.on('click', function () {
  selectCoffeeType(this.id, true);
});

function setLoadingModal(show) {
  var backtdrop = $('#backdrop');
  var loadingModal = $('#loadingModal');

  if (show) {
    backtdrop.removeClass('hidden');
    loadingModal.removeClass('hidden');
  } else {
    backtdrop.addClass('hidden');
    loadingModal.addClass('hidden');
  }

}

function generateNewQRcode(address, type) {
  var price;
  switch (type) {
    case 'normal':
      price = prices.normal;
      break;
    case 'strong':
      price = prices.strong;
      break;
  }

  $('#qrcode').html("");
  new QRCode('qrcode', {
    text: 'byteball:' + address + '?amount=' + price *100000 + '&asset=' + encodeURIComponent(assetId) ,
    width: qrCodeWidth,
    height: qrCodeWidth,
    colorDark: "#EC1B24",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function selectCoffeeType(type, emit) {

  var buttonId = '#' + type;

  switch (type) {
    case 'normal':
      setPrice(prices.normal);
      break;
    case 'strong':
      setPrice(prices.strong);
      break;
  }
  if (emit) {
    socket.emit('newOrder', {type: type});
  }

  button.removeClass(activeButtonClass);
  $(buttonId).addClass(activeButtonClass);
}

function setPrice(price) {
  $('#price').text(price);
}