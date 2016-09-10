'use strict'

const spawn             = require('child_process').spawn;
const chalk             = require('chalk');
const kill              = require('tree-kill');
const customEvts        = require('./constants').events;
const status            = require('./constants').status;
const processEvt        = require('./constants').processEvt;
const baseConfig        = Object.assign({ FORCE_COLOR: true }, process.env);

let starter = function(config, subject) {
    let extendedConfig = extendConfig(config);
    let child = spawn(extendedConfig.command, extendedConfig.args, extendedConfig.options);

    //settings for stdin
    child.stdin.setEncoding('utf-8');

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

let extendConfig = function(config) {
    let extendedOptions = Object.assign(baseConfig, config.options);
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
}

module.exports = {
    starter: starter,
    stopper: stopper
}