'use strict'

const starter               = require('./lib/process-utils').starter;
const restarter             = require('./lib/process-utils').restarter;
const stopper               = require('./lib/process-utils').stopper;
const status                = require('./lib/constants').status;
const minimalConfigChecker  = require('./lib/constants').minimalConfigChecker;
const customEvts            = require('./lib/constants').events;
const processEvt            = require('./lib/constants').processEvt;
const Type                  = require('type-of-is');
const Rx                    = require('rx');

class SpawnWatch {
    constructor(options){
        this._status            = new Rx.BehaviorSubject(status.stopped);
        this._childProcess      = null;
        this._currentConfig     = null;
        this._evtStream         = new Rx.Subject();

        //register options (default is no IPC channel, utf-8 encoding for inputs)
        this._options           = Object.assign({
            ipc:false,
            encodings:{
                stdin:'utf-8',
                stdout:'utf-8',
                stderr:'utf-8'
            }
        }, options);

        //status update from process events
        this.processEventStream.subscribe(newStatus => { this._status.onNext(newStatus); });

        //react to status changes
        this._status.subscribe(newStatus => { 
            if(newStatus === status.stopped) {
                this._currentConfig     = null;
                this._childProcess      = null;
            }
        });
    };

    //spawn process according to config object
    start(config) {
        if(this._status.value === status.stopped && config && minimalConfigChecker(config)) {
            let evtA = new processEvt(customEvts.process, status.pendingStart);
            this._evtStream.onNext(evtA);
            this._currentConfig = config;
            this._childProcess = starter(config, this._evtStream, this._options);

            //fire started evt
            let evtB = new processEvt(customEvts.process, status.started);
            this._evtStream.onNext(evtB);
        } else {
            //conditions not met to spawn process
            return false;
        }
        return true;
    }

    //stop process
    stop() {
        if(this._childProcess && this._status.value === status.started) {
            let evt = new processEvt(customEvts.process, status.pendingStop);
            this._evtStream.onNext(evt);
            stopper(this._childProcess, this._evtStream);
            return true;
        } else {
            //conditions not met to kill process
            return false;
        }
    }

    //stop & spawn again process (optionaly according to config object)
    restart(config) {
        if(this._status.value === status.started) {
            if(config) {
                if(minimalConfigChecker(config)) {
                    //restart enabled with new config
                    let restartSubscription = this.processEventStream
                        .filter(processStatus => { return processStatus === status.stopped })
                        .subscribe(processStatus => {
                            this.start(config);
                            if(restartSubscription.unsubscribe) restartSubscription.unsubscribe();
                        });
                    this.stop();
                    return true;
                } else {
                    //conditions not met to re-spawn process
                    return false;
                }
            } else {
                //restart enabled with previous config
                let storeConfig = this.currentConfig;
                let restartSubscription = this.processEventStream
                    .filter(processStatus => { return processStatus === status.stopped })
                    .subscribe(processStatus => {
                        this.start(storeConfig);
                        if(restartSubscription.unsubscribe) restartSubscription.unsubscribe();
                    });
                this.stop();
                return true;
            }
        } else {
            //conditions not met to re-spawn process
            return false;
        }
    }

    //input data to the spawned process (via stdin)
    input(data) {
        if(!this._childProcess || !data) return false;
        let stdin = this._childProcess.stdin;

        //adapt depending on data type. Accepts string or JSON
        let payload = (Type.is(data, String)) ? data : JSON.stringify(data);

        stdin.write(payload);

        return true;
    }

    //input via ipc
    ipcInput(data) {
        if(this._childProcess && this._childProcess.send) {
            //only works when there is a childprocess with ipc
            this._childProcess.send(data);
            return true;
        }
        return false;
    }

    get processStatus() { return this._status.value; }
    get currentConfig() { return Object.assign({}, this._currentConfig); }
    get processEventStream() { 
        let processStream = this._evtStream.asObservable()
            .filter(evt => { return (evt.type === customEvts.process) })
            .map(evt => { return evt.payload });
        return processStream; 
    }
    get outEventStream() { 
        let outEventStream = this._evtStream.asObservable()
            .filter(evt => { return (evt.type === customEvts.logs) })
            .map(evt => { return evt.payload });
        return outEventStream; 
    }
    get errorStream() { 
        let errorStream = this._evtStream.asObservable()
            .filter(evt => { return (evt.type === customEvts.childError) })
            .map(evt => { return evt.payload });
        return errorStream; 
    }

    //only emits for ipc enabled processes
    get ipcStream() {
        let ipcStream = this._evtStream.asObservable()
            .filter(evt => { return (evt.type === customEvts.ipcData) })
            .map(evt => { return evt.payload });
        return ipcStream;
    }
}

module.exports = SpawnWatch;