'use strict'

const Type                  = require('type-of-is');

const status = {
    stopped: 'stopped',
    started: 'started',
    pendingStart: 'pending start',
    pendingStop: 'pending stop'
}

const events = {
    process: 'processEvt',
    logs: 'processLogtEvt',
    childError: 'processErrorEvt'
}

class processEvt {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
}

const minimalConfigChecker = function(config) {
    if(!config.hasOwnProperty('command') || !Type.is(config.command, String)) return false;
    if(!config.hasOwnProperty('args') || !Type.is(config.args, Array)) return false;
    if(!config.hasOwnProperty('options') || !Type.is(config.options, Object)) return false;
    return true;
};

module.exports = {
    status: status,
    minimalConfigChecker: minimalConfigChecker,
    events: events,
    processEvt: processEvt
}