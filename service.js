
var bleno = require('bleno');
var BlenoPrimaryService = bleno.PrimaryService;
var MactivCharacteristic = require('./characteristic');

var name = 'AL20-0001-TEST';
var serviceUUIDs = ["8909c3d2-759d-4a03-81a7-3764b53c4f41"];

console.log("Starting bleno...");

bleno.on("stateChange", state => {
    console.log('on -> stateChange: ' + state);

    if (state === 'poweredOn') {
        console.log("Starting broadcast...");

        bleno.startAdvertising(name, serviceUUIDs, err => {
            if (err) {
                console.error(err);
            } else {
                console.log(`Broadcasting as ${name} with UUID: ${serviceUUIDs}`);
            }
        });
    } else {
        console.log("Stopping broadcast...");
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function (error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
    if (!error) {
        bleno.setServices([
            new BlenoPrimaryService({
                uuid: serviceUUIDs[0],
                characteristics: [
                    new MactivCharacteristic()
                ]
            })
        ]);
    }
});

