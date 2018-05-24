/*jslint node: true */
"use strict";

const conf = require('byteballcore/conf.js');
const device = require('byteballcore/device.js');
const walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
const crypto = require('crypto');
const fs = require('fs');
const db = require('byteballcore/db.js');
const eventBus = require('byteballcore/event_bus.js');
const desktopApp = require('byteballcore/desktop_app.js');
const coffeeController = require('./coffee');

let coffee = new coffeeController();
coffee.init(process.env.RPI)

const socket = require('./userInterfaceServer');

require('byteballcore/wallet.js'); // we don't need any of its functions but it listens for hub/* messages

const appDataDir = desktopApp.getAppDataDir();
const KEYS_FILENAME = appDataDir + '/' + conf.KEYS_FILENAME;

let wallet;

const arrCoffees = {
  normal: {name: 'Normal', price: conf.NormalCoffeePrice},
  strong: {name: 'Strong', price: conf.StrongCoffeePrice},
};

let objDirectOrders = {};

function getCoffeeList() {
  var arrItems = [];
  for (var code in arrCoffees)
    arrItems.push('[' + arrCoffees[code].name + ' ' + arrCoffees[code].price + '](command:' + code + ')' + ' BC \n');
  return arrItems.join("");
}

function replaceConsoleLog() {
  var clog = console.log;
  console.log = function () {
    Array.prototype.unshift.call(arguments, Date().toString() + ':');
    clog.apply(null, arguments);
  }
}

function readKeys(onDone) {
  fs.readFile(KEYS_FILENAME, 'utf8', function (err, data) {
    if (err) {
      console.log('failed to read keys, will gen');
      var devicePrivKey = crypto.randomBytes(32);
      var deviceTempPrivKey = crypto.randomBytes(32);
      var devicePrevTempPrivKey = crypto.randomBytes(32);
      createDir(appDataDir, function () {
        writeKeys(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey, function () {
          onDone(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey);
        });
      });
      return;
    }
    var keys = JSON.parse(data);
    onDone(Buffer(keys.permanent_priv_key, 'base64'), Buffer(keys.temp_priv_key, 'base64'), Buffer(keys.prev_temp_priv_key, 'base64'));
  });
}

function createDir(path, onDone) {
  var mode = parseInt('700', 8);
  var parent_dir = require('path' + '').dirname(path);
  fs.mkdir(parent_dir, mode, function (err) {
    console.log('mkdir ' + parent_dir + ': ' + err);
    fs.mkdir(path, mode, function (err) {
      console.log('mkdir ' + path + ': ' + err);
      onDone();
    });
  });
}

function writeKeys(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey, onDone) {
  var keys = {
    permanent_priv_key: devicePrivKey.toString('base64'),
    temp_priv_key: deviceTempPrivKey.toString('base64'),
    prev_temp_priv_key: devicePrevTempPrivKey.toString('base64')
  };
  fs.writeFile(KEYS_FILENAME, JSON.stringify(keys), 'utf8', function (err) {
    if (err)
      throw Error("failed to write keys file " + KEYS_FILENAME);
    if (onDone)
      onDone();
  });
}

function readCurrentState(device_address, handleState) {
  db.query("SELECT state_id, `order`, step FROM states WHERE device_address=? ORDER BY state_id DESC LIMIT 1", [device_address], function (rows) {
    if (rows.length === 0)
      throw Error('no current state');
    var state = rows[0];
    state.order = JSON.parse(state.order);
    handleState(state);
  });
}

function createNewSession(device_address, onDone) {
  var step = 'waiting_for_choice_of_coffee';
  db.query("INSERT INTO states (device_address, step, `order`) VALUES (?,?,'{}')", [device_address, step], function () {
    if (onDone)
      onDone();
  });
}

function updateState(state, onDone) {
  db.query(
    "UPDATE states SET step=?, `order`=?, amount=?, address=? WHERE state_id=?",
    [state.step, JSON.stringify(state.order), state.amount, state.address, state.state_id],
    function () {
      if (onDone)
        onDone();
    }
  );
}

function cancelState(state) {
  db.query("UPDATE states SET cancel_date=" + db.getNow() + " WHERE state_id=?", [state.state_id]);
}

function createWallet(onDone) {
  walletDefinedByKeys.createSinglesigWalletWithExternalPrivateKey(conf.xPubKey, conf.account, conf.homeDeviceAddress, function (_wallet) {
    wallet = _wallet;
    onDone();
  });
}

function handleNoWallet(from_address) {
  if (from_address === conf.homeDeviceAddress && wallet === null)
    createWallet(function () {
      device.sendMessageToDevice(from_address, 'text', "Wallet created, all new addresses will be synced to your device");
    });
  else
    device.sendMessageToDevice(from_address, 'text', "The shop is not set up yet, try again later");
}


replaceConsoleLog();

if (!conf.permanent_pairing_secret)
  throw Error('no conf.permanent_pairing_secret');
db.query(
  "INSERT " + db.getIgnore() + " INTO pairing_secrets (pairing_secret, expiry_date, is_permanent) VALUES(?, '2035-01-01', 1)",
  [conf.permanent_pairing_secret]
);

db.query("SELECT wallet FROM wallets", function (rows) {
  if (rows.length > 1)
    throw Error('more than 1 wallet');
  if (rows.length === 1) {
    wallet = rows[0].wallet;
    socket.setWallet(wallet);
  } else
    wallet = null; // different from undefined
});


readKeys(function (devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey) {
  var saveTempKeys = function (new_temp_key, new_prev_temp_key, onDone) {
    writeKeys(devicePrivKey, new_temp_key, new_prev_temp_key, onDone);
  };
  device.setDevicePrivateKey(devicePrivKey);
  device.setTempKeys(deviceTempPrivKey, devicePrevTempPrivKey, saveTempKeys);
  device.setDeviceName(conf.deviceName);
  device.setDeviceHub(conf.hub);

  if (conf.bLight) {
    var light_wallet = require('byteballcore/light_wallet.js');
    light_wallet.setLightVendorHost(conf.hub);
  }

  var my_device_pubkey = device.getMyDevicePubKey();
  console.log("my device pubkey: " + my_device_pubkey);
  console.log("my pairing code: " + my_device_pubkey + "@" + conf.hub + "#" + conf.permanent_pairing_secret);
});


eventBus.on('paired', function (from_address) {
  if (!wallet)
    return handleNoWallet(from_address);
  createNewSession(from_address, function () {
    device.sendMessageToDevice(from_address, 'text', "Hi! Choose your coffee:\n" + getCoffeeList() + "\n");
  });
});

eventBus.on('text', function (from_address, text) {

  if (!wallet)
    return handleNoWallet(from_address);
  text = text.trim().toLowerCase();
  readCurrentState(from_address, function (state) {

    console.log("current state.step: " + state.step);
    switch (state.step) {
      case 'waiting_for_choice_of_coffee':
        if (!arrCoffees[text])
          return device.sendMessageToDevice(from_address, 'text', "Please choose your coffee:\n" + getCoffeeList());
        walletDefinedByKeys.issueNextAddress(wallet, 0, function (objAddress) {
          state.address = objAddress.address;
          state.order.coffee = text;
          state.step = 'waiting_for_payment';
          state.amount = arrCoffees[state.order.coffee].price;
          var response = "You've ordered " + state.amount + " " + arrCoffees[state.order.coffee].name + " Coffee. Please pay.\n[" + state.amount + " bytes](byteball:" + state.address + "?amount=" + arrCoffees[state.order.coffee].price * 100000 + "&asset=" + encodeURIComponent(conf.boschCoinAssetId) + ")";
          updateState(state);
          device.sendMessageToDevice(from_address, 'text', response);
        });
        break;
      case 'waiting_for_payment':
        if (text !== 'cancel')
          return device.sendMessageToDevice(from_address, 'text', "Waiting for your payment.  If you want to cancel the order and start over, click [Cancel](command:cancel).");
        cancelState(state);
        createNewSession(from_address, function () {
          device.sendMessageToDevice(from_address, 'text', "Order canceled.\nChoose your coffee:\n" + getCoffeeList());
        });
        break;

      case 'unconfirmed_payment':
        device.sendMessageToDevice(from_address, 'text', "We're pouring your coffee now while we are waiting for confirmation of your payment.");
        break;

      case 'done':
      case 'doublespend':
        createNewSession(from_address, function () {
          var response = (state.step === 'done')
            ? "The order was paid and your coffee will be dispensed.\nIf you want to order another coffee,"
            : "Your payment appeared to be double-spend and was rejected.\nIf you want to make a new order,";
          response += " choose the coffee:\n" + getCoffeeList();
          device.sendMessageToDevice(from_address, 'text', response);
        });
        break;

      default:
        throw Error("unknown state: " + state);
    }
  });
});


eventBus.on('new_my_transactions', function (arrUnits) {
  try {
    console.log('################### new transaction')
    console.log(arrUnits);

    db.query(
      "SELECT state_id, outputs.unit, device_address, states.amount AS expected_amount, `order`, outputs.amount AS paid_amount, outputs.asset \n\
      FROM outputs JOIN states USING(address) WHERE outputs.unit IN(?) AND pay_date IS NULL",
      [arrUnits],
      function (rows) {
        if (rows.length === 0) {
            db.query(
                "SELECT * FROM outputs WHERE outputs.unit IN(?) AND outputs.message_index = 1",
                [arrUnits],
                function (rows) {
                    rows.forEach(function (row) {
                        console.log(row);
                        const receiving_address = row.address;
                        const amount = row.amount;
                        const asset = row.asset;

                        if (objDirectOrders[receiving_address] != null) {
                            console.log('found new direct order')
                            console.log(objDirectOrders[receiving_address])
                            const paid = amount / 100000;
                            // TODO check correct amount
                            const type = objDirectOrders[receiving_address]
                            coffee.startCoffee( type );
                            socket.coffeePaid();

                        } else {
                            console.log('no direct order found')
                        }



                    });
                }
            );
        } else {

          rows.forEach(function (row) {
            console.log(row);

            const paid = row.paid_amount / 100000;
            const order = JSON.parse(row.order).coffee;

            if (row.asset !== conf.boschCoinAssetId)
              return device.sendMessageToDevice(row.device_address, 'text', "Received payment in wrong asset");
            if (row.expected_amount !== paid) {
              return device.sendMessageToDevice(row.device_address, 'text', "Received incorrect amount from you: expected " + row.expected_amount + " Bosch Coins, received " + paid + " bytes.  The payment is ignored.");
            }

            db.query("UPDATE states SET pay_date=" + db.getNow() + ", unit=?, step='unconfirmed_payment' WHERE state_id=?", [row.unit, row.state_id]);
            device.sendMessageToDevice(row.device_address, 'text', `We're pouring your coffee now while we are waiting for confirmation of your payment.`);

            coffee.startCoffee( order );
            socket.coffeePaid();

          });
        }
      }
    );
  } catch(e) {
    console.error(e);
  }
});

eventBus.on('my_transactions_became_stable', function (arrUnits) {
  db.query(
    "SELECT state_id, device_address, sequence \n\
    FROM states JOIN units USING(unit) WHERE unit IN(?) AND confirmation_date IS NULL",
    [arrUnits],
    function (rows) {
      rows.forEach(function (row) {
        var step = (row.sequence === 'good') ? 'done' : 'doublespend';
        db.query("UPDATE states SET confirmation_date=" + db.getNow() + ", step=? WHERE state_id=?", [step, row.state_id]);
        device.sendMessageToDevice(
          row.device_address, 'text',
          (step === 'done')
            ? "Payment confirmed.  Your order is on its way to you!"
            : "Your payment appeared to be double-spend.  The order will not be fulfilled"
        );

        // todo: actually deliver the pizza
      });
    }
  );
});

function createNewAddress() {
  return new Promise((resolve, reject) => {
    if (wallet) {
          walletDefinedByKeys.issueNextAddress(wallet, 0, function (objAddress) {
              resolve(objAddress)
          });
    } else {
      reject('no wallet')
    }
  })

}

socket.getSocket().on('connection', function (ioSocket) {

    ioSocket.on('newOrder', (type) => {
        createNewAddress()
            .then(address => {
                const orderType = type.type.toLowerCase();
                objDirectOrders[address.address] = orderType;
                console.log('Received new order', orderType);
                console.log('Generated new address for order', address.address);
                ioSocket.emit('generatedNewAddress', {address: address.address, type: orderType});
                console.log(objDirectOrders)
            })
    })
});
