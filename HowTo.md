# Bosch Coffeemachine

### Requirements
- NodeJS
- ```npm install sqlite3 -g```

### Steps

1. Create a new Wallet (*Important: it must be a multi address wallet!*)

2. Change in conf.js 
    - set **bLight** = true
    - change **deviceName** = "your name for that device"
    - Go to your wallet, select settings -> Advanced -> Wallet Information
        - Copy "Extended Public Keys" and add it to the conf.js in **xPubKey**
    - Check on the same page as xPubKey the account number (Account BIP44) and add the number to **account**     
    - Go back to your wallet and open the drawer. Select Settings and copy the Device Address to **homeDeviceAddress**

3. Go to ````$ cd ~/Library/Application\ Support/byteball-merchant/````
4. Edit the byteball-light.sqlite with sqlite3 ````$ sqlite3 byteball-light.sqlite````
5. Copy & Paste the content from the merchant.sql (project folder) file into the console
6. Run the app with ````$ node merchant````
7. To run the app for RaspberryPi please set RPI flag to true. ````$ RPI=true node merchant.js



### Contributors
- Hannes Roth
- Daniel Groezinger
- Matthias Knapp
- Rui Lun Tran
