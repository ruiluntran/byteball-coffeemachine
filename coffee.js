/*
*   Let's make some coffee
 */

let coffeeController = function() {

    this.rpi = false;
    this.coffeePort = 15;
    this.favoriteSelectorPort = 16;

    // currentSelection: 1 == normal, 0 == strong; default after boot is 1
    this._currentSelection = 1;

    this.init = function (enableGpio) {
        console.log('###################################################################################################');
        console.log('Activating Coffee Controller')

        if (enableGpio) {
            console.log('Raspberry Pi detected, enabling Gpio ports')
            this.rpi = true;
            this.gpio = require('rpi-gpio');
            this.gpio.setup(this.coffeePort, gpio.DIR_OUT);
            this.gpio.setup(this.favoriteSelectorPort, gpio.DIR_OUT);
        } else {
            console.log('Running in Testmode, Gpio ports not enabled')
        }

        console.log('###################################################################################################');
    };

    this.startCoffee = (type) => {
        console.log('###################################################################################################');
        console.log('Start Coffee');

        if (!type) return console.log('invalid choice, not pouring coffee for you');


        if (this.rpi) {

            return this.checkCurrentSelection()
                .then(selection => {
                    console.log('Check selection')
                    console.log(`Current selection ${selection === 1 ? 'normal' : 'strong'}`)
                    // Select other type if necessary
                    if ((type === 'normal' && selection !== 1) || (type === 'strong' && selection !== 0)) {
                        return this.toggleSelector()
                    }
                    return true;
                })
                .then(() => {
                    console.log('Pouring coffee')
                    // Push coffee button
                    return this._pushButton(this.coffeePort)
                })
                .then(()=>{
                        console.log('success')
                })

        } else {
            console.log('Running in Testmode, not triggering Gpio')
        }

        console.log('###################################################################################################');
    };

    this.toggleSelector = () => {
        console.log('###################################################################################################');
        console.log('Toggle coffee selection');

        this._currentSelection = !this._currentSelection;
        if (this.rpi) {
            return this._pushButton(this.favoriteSelectorPort)
        } else {
            console.log('Running in Testmode, not triggering Gpio')
            return true;
        }

        console.log('###################################################################################################');
    }

    this.checkCurrentSelection = () => {
        return this._currentSelection;
    };

    this._pushButton = port => {

        return new Promise(resolve, reject => {

            this.gpio.write(port, true, (err) => {
                if (err) {
                    reject(err)
                }
                console.log(`Port ${port} pushed`);

                setTimeout(() => {
                    this.gpio.write(port, false, (err) => {

                        if (err) {
                            reject(err)
                        }

                        console.log('Port reset to default after 500ms');
                        resolve(true)
                    });
                }, 500)
            });
        })
    }
}

module.exports = coffeeController;
