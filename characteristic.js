var util = require('util');
var bleno = require('bleno');
var Wifi = require('rpi-wifi-connection');
var wifi = new Wifi();

var BlenoCharacteristic = bleno.Characteristic;

var mactivCharacteristicUUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
var mactivCharacteristicProperties = ['read', 'write', 'notify'];
var processState = 1;
var ssid = '';
var pass = '';

var MactivCharacteristic = function () {
    MactivCharacteristic.super_.call(this, {
        uuid: mactivCharacteristicUUID,
        properties: mactivCharacteristicProperties,
    });
    this._value = new Buffer(0);
    this._updateValueCallback = null;
};
util.inherits(MactivCharacteristic, BlenoCharacteristic);
module.exports = MactivCharacteristic;

MactivCharacteristic.prototype.onReadRequest = function (offset, callback) {
    console.log('Mactiv onReadRequest');

    var encoder = new util.TextEncoder('utf-8');
    var hexVal = encoder.encode(processState.toString());
    var data = new Buffer.from(hexVal);
    // data.writeUInt8(1, 0);
    callback(this.RESULT_SUCCESS, data);
};

MactivCharacteristic.prototype.onWriteRequest = async function (data, offset, withoutResponse, callback) {
    console.log('Mactiv - onWriteRequest');
    
    this._value = data;
    
    var text = this._value.toString();
    var method = text.split(', ')[0];
    console.log('Value: ' + text);
    console.log('Method: ' + ssid);
    if(method == "2") {
	processState = 2;
	ssid = text.split(', ')[1];
	pass = text.split(', ')[2];
	console.log('SSID: ' + ssid);
	console.log('Pass: ' + pass);
	//CONNECT TO WIFI
	var connected = await wifi.getState();
	if (connected) {
		// TODO: check connection
		processState = 3;
		console.log('Connected to network.');
		setTimeout(function () { processState = 4; }, 5000);
		setTimeout(function () { processState = 5; }, 8000);
	} else {
		wifi.connect({ssid:ssid, psk: pass}).then(() => {
			// TODO: check connection
			processState = 3;
			console.log('Connected to network.');
			setTimeout(function () { processState = 4; }, 5000);
			setTimeout(function () { processState = 5; }, 8000);
		}).catch((error) => {
			// Cant connect to WiFi
			console.log(error);
			processState = 11;
		});
	}
    }
    callback(this.RESULT_SUCCESS);
};

var isSubscribed = false
var notifyInterval = 5 //seconds
function delayedNotification(callback) {
    setTimeout(function () {
        if (isSubscribed) {
            var data = Buffer(3);
            var now = new Date();
            data.writeUInt8(now.getHours(), 0);
            data.writeUInt8(now.getMinutes(), 1);
            data.writeUInt8(now.getSeconds(), 2);
            callback(data);
            delayedNotification(callback);
        }
    }, notifyInterval * 1000);
}

MactivCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    console.log('MactivCharacteristic - onSubscribe');
    isSubscribed = true; 
    delayedNotification(updateValueCallback);
    this._updateValueCallback = updateValueCallback;
};

MactivCharacteristic.prototype.onUnsubscribe = function () {
    console.log('CustomCharacteristic - onUnsubscribe');
    isSubscribed = false;
    this._updateValueCallback = null;
};

