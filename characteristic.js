var util = require('util');
var bleno = require('bleno');

var BlenoCharacteristic = bleno.Characteristic;

var mactivCharacteristicUUID = 'ab0a';
var mactivCharacteristicProperties = ['read', 'write', 'notify'];

var MactivCharacteristic = function() {
    MactivCharacteristic.super_.call(this, {
        uuid: mactivCharacteristicUUID,
        properties: ['read', 'write', 'notify'],
    });
    this._value = new Buffer(0);
    this._updateValueCallback = null;
};
util.inherits(MactivCharacteristic, BlenoCharacteristic);
module.exports = MactivCharacteristic;

MactivCharacteristic.prototype.onReadRequest = function (offset, callback) {
    console.log('Mactiv onReadRequest');
    var data = new Buffer(1);
    data.writeUInt8(1, 0);
    callback(this.RESULT_SUCCESS, data);
};

MactivCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    this._value = data;
    console.log('Mactiv - onWriteRequest: value = ' +       this._value.toString('hex'));
    console.log(typeof data);
    callback(this.RESULT_SUCCESS);
};

var isSubscribed = false
var notifyInterval = 5 //seconds
function delayedNotification(callback) {
    setTimeout(function() { 
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

MactivCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('MactivCharacteristic - onSubscribe');
    isSubscribed = true;
    delayedNotification(updateValueCallback);
    this._updateValueCallback = updateValueCallback;
};

MactivCharacteristic.prototype.onUnsubscribe = function() {
    console.log('CustomCharacteristic - onUnsubscribe');
    isSubscribed = false;
    this._updateValueCallback = null;
};

