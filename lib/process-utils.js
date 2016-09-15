'use strict'

const spawn             = require('child_process').spawn;
const kill              = require('tree-kill');
const customEvts        = require('./constants').events;
const status            = require('./constants').status;
const processEvt        = require('./constants').processEvt;
const baseConfig        = Object.assign({}, process.env);

let starter = function(config, subject, options) {
    let extendedConfig = extendConfig(config, options.ipc);
    let child = spawn(extendedConfig.command, extendedConfig.args, extendedConfig.options);

    //encoding settings
    child.stdin.setEncoding(options.encodings.stdin);
    child.stdout.setEncoding(options.encodings.stdout);
    child.stderr.setEncoding(options.encodings.stderr);

    //pipe stdout, stderr & listen to close event
    setupListeners(child, subject);

    return child;
};

let stopper = function(previousChildProcess, subject) {
    //kill process
    previousChildProcess.removeAllListeners();
    kill(previousChildProcess.pid, 'SIGKILL', (err) => {
        if(err) {
            let errEvt = new processEvt(customEvts.childError, `failed killing process evt: ${err}`);
            subject.onNext(errEvt);
        }
        let evt = new processEvt(customEvts.process, status.stopped);
        subject.onNext(evt);
    });
};

let extendConfig = function(config, hasIPC) {
    let extendedOptions = Object.assign(baseConfig, config.options);

    //manage IPC channel
    if(hasIPC){
        if(!extendedOptions.stdio) {
            extendedOptions.stdio = ['pipe', 'pipe', 'pipe', 'ipc'];
        } else if(extendedOptions.stdio.indexOf('ipc') === -1) {
            extendedOptions.stdio.push('ipc');
        }
    }

    //merge with general config
    config.options = extendedOptions;

    return config;
}

let setupListeners = function(process, subject) {
    process.stdout.on('data', (data) => {
        //console.log('stdout: ' + data);
        let evt = new processEvt(customEvts.logs, data.toString());
        subject.onNext(evt);
    });

    process.stderr.on('data', (data) => {
        //console.log('stderr: ' + data);
        let evt = new processEvt(customEvts.childError, data.toString());
        subject.onNext(evt);
    });

    process.on('error', (err) => {
        //console.log('error: ' + err);
        let evt = new processEvt(customEvts.childError, `child process failed to proceed ${err}`);
        subject.onNext(evt);
    });

    process.on('close', (code) => {
        //console.log('close: ' + code);
        let evt = new processEvt(customEvts.process, status.stopped);
        subject.onNext(evt);
    });

    if(process.send){
        //bind ipc channel
        process.on('message', data => {
            let evt = new processEvt(customEvts.ipcData, data);
            subject.onNext(evt);
        });
    }
}

module.exports = {
    starter: starter,
    stopper: stopper
}