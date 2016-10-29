'use strict'

const SpawnWatch             = require('../index');
const testConfigs            = require('./assets/test-configs');
const status                 = require('../lib/constants').status;
const Rx                     = require('rx');
const kill                   = require('tree-kill');
const chalk                  = require('chalk');
const hasAnsi                = require('has-ansi');

describe('spawn-watch API methods', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        spawnWatch = new SpawnWatch();
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });

    describe(`spawn-watch START method`, function() {
        it('START method exists', function(){
            expect(spawnWatch.start).to.exist;
        });
        it('START without config doesn\'t work', function(){
            expect(spawnWatch.start()).to.be.equal(false);
        });
        it('START with invalid config doesn\'t work', function(){
            expect(spawnWatch.start(testConfigs.invalidConfig)).to.be.equal(false);
        });
        it('START with valid config works', function(){
            expect(spawnWatch.start(testConfigs.fastEndingConfig)).to.not.be.equal(false);
        });
        it('START with valid config but bad command throws an error', function(){
            spawnWatch.start(testConfigs.badCommandConfig);
        });
        it('START an already started process doesn\'t work', function(){
            spawnWatch.start(testConfigs.fastEndingConfig);
            expect(spawnWatch.start(testConfigs.fastEndingConfig)).to.be.equal(false);
        });
    });
    describe(`spawn-watch RESTART method`, function() {
        it('RESTART method exists', function(){
            expect(spawnWatch.restart).to.exist;
        });
        it('RESTART without config spawn the same process (killing the previous one)', function(done){
            let firstProcessId, secondProcessId;
            let firstConfig, secondConfig;
            spawnWatch.processEventStream.subscribe(evt => {
                if(!firstProcessId && evt === status.started){
                    firstConfig = spawnWatch._currentConfig;
                    firstProcessId = spawnWatch._childProcess.pid;
                    spawnWatch.restart();
                } else if(firstProcessId && evt === status.started){
                    secondConfig = spawnWatch._currentConfig;
                    secondProcessId = spawnWatch._childProcess.pid;
                    expect(firstConfig).to.deep.equal(secondConfig);
                    expect(firstProcessId).to.not.equal(secondProcessId);
                    done();
                }
            });
            spawnWatch.start(testConfigs.fastEndingConfig);
        });
        it('RESTART with valid config spawn the new process (killing the previous one)', function(done){
            let firstProcessId, secondProcessId;
            let firstConfig, secondConfig;
            spawnWatch.processEventStream.subscribe(evt => {
                if(!firstProcessId && evt === status.started){
                    firstConfig = spawnWatch._currentConfig;
                    firstProcessId = spawnWatch._childProcess.pid;
                    spawnWatch.restart(testConfigs.durationConfig);
                } else if(firstProcessId && evt === status.started){
                    secondConfig = spawnWatch._currentConfig;
                    secondProcessId = spawnWatch._childProcess.pid;
                    expect(firstConfig).to.not.deep.equal(secondConfig);
                    expect(firstProcessId).to.not.equal(secondProcessId);
                    done();
                }
            });
            spawnWatch.start(testConfigs.fastEndingConfig);
        });
        it('RESTART an instance that isn\'t started yet doesn\'t work', function(){
            expect(spawnWatch.restart()).to.be.equal(false);
        });
    });
    describe(`spawn-watch STOP method`, function() {
        it('STOP method exists', function(){
            expect(spawnWatch.stop).to.exist;
        });
        it('STOP a started instance works', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            expect(spawnWatch.processStatus).to.be.equal(status.started);
            spawnWatch.processEventStream.subscribe((evt)=>{
                if(evt === status.stopped) done();
            });
            expect(spawnWatch.stop()).to.be.equal(true);
        });
        it('STOP an instance that isn\'t started yet doesn\'t work', function(){
            expect(spawnWatch.processStatus).to.be.equal(status.stopped);
            expect(spawnWatch.stop()).to.be.equal(false);
        });
    });
    describe(`Stress tests when chaining rapidly process methods`, function() {
        it('START | RESTART chained to stress test --> end up started', function(done){
            spawnWatch.start(testConfigs.durationConfig);
            spawnWatch.restart();
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.started);
                done();
            }, 750);
        });
        it('START | STOP chained to stress test --> end up stopped', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            spawnWatch.stop();
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.stopped);
                done();
            }, 750);
        });
        it('STOP | START chained to stress test --> end up stopped (last start doesn\'t count)', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            spawnWatch.stop();
            expect(spawnWatch.start(testConfigs.fastEndingConfig)).to.be.equal(false);
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.stopped);
                done();
            }, 750);
        });
        it('STOP | RESTART chained to stress test --> end up stopped (last restart doesn\'t count)', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            spawnWatch.stop();
            expect(spawnWatch.restart()).to.be.equal(false);
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.stopped);
                done();
            }, 750);
        });
        it('RESTART | START chained to stress test --> end up restarted (last start doesn\'t count)', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            spawnWatch.restart(testConfigs.durationConfig);
            expect(spawnWatch.start(testConfigs.fastEndingConfig)).to.be.equal(false);
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.started);
                done();
            }, 750);
        });
        it('START | RESTART (same config) | STOP chained to stress test --> end up restarted (last stop doesn\'t count)', function(done){
            spawnWatch.start(testConfigs.durationConfig);
            spawnWatch.restart();
            expect(spawnWatch.stop()).to.be.equal(false);
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.started);
                done();
            }, 750);
        });
        it('START | RESTART | STOP chained to stress test --> end up restarted (last stop doesn\'t count)', function(done){
            spawnWatch.start(testConfigs.fastEndingConfig);
            spawnWatch.restart(testConfigs.durationConfig);
            expect(spawnWatch.stop()).to.be.equal(false);
            setTimeout(function(){
                expect(spawnWatch.processStatus).to.be.equal(status.started);
                done();
            }, 750);
        });
    });
    describe(`spawn-watch INPUT method (send inputs via stdin)`, function() {
        it('INPUT method exists', function(){
            expect(spawnWatch.input).to.exist;
        });
        it('INPUT without parameter fails', function(){
            expect(spawnWatch.input()).to.be.equal(false);
        });
        it('INPUT string on a started instance works', function(done){
            let testInputTxt = 'TEST INPUT';
            spawnWatch.processEventStream.subscribe((evt)=>{
                if(evt === status.started) {
                    expect(spawnWatch.input(testInputTxt)).to.be.equal(true);
                }
            });
            spawnWatch.outEventStream.subscribe((evt)=>{
                //receive stdout (that only mirrors back inputs)
                let trimedOfNewlineString = evt.replace(/\r?\n|\r/, '');
                expect(trimedOfNewlineString).to.be.equal(testInputTxt);
                done();
            });
            spawnWatch.start(testConfigs.inputCommandConfig);
        });
        it('INPUT JSON on a started instance works', function(done){
            let testInputJson = {
                test: "input",
                testArray: ['I\'m', 'a', 'test', 'array']
            };
            spawnWatch.processEventStream.subscribe((evt)=>{
                if(evt === status.started) {
                    expect(spawnWatch.input(testInputJson)).to.be.equal(true);
                }
            });
            spawnWatch.outEventStream.subscribe((evt)=>{
                //receive stdout (that only mirrors back inputs)
                let parsedJson = JSON.parse(evt);
                expect(parsedJson).to.be.deep.equal(testInputJson);
                done();
            });
            spawnWatch.start(testConfigs.inputCommandConfig);
        });
        it('INPUT an instance that isn\'t started yet doesn\'t work', function(){
            expect(spawnWatch.input('TEST input')).to.be.equal(false);
        });
        it('ipcINPUT doesn\'t work when an instance has no ipc channel', function(){
            //no ipc channel declared in this instance
            spawnWatch.start(testConfigs.durationConfig);
            expect(spawnWatch.ipcInput('TEST input')).to.be.equal(false);
        });
    });
});
describe('spawn-watch API getter methods', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        spawnWatch = new SpawnWatch();
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });
    
    describe(`spawn-watch processStatus`, function() {
        it('an instance that has never been started has status [stopped]', function(){
            expect(spawnWatch.processStatus).to.be.equal(status.stopped).and.to.be.a('string');
        });
        it('an instance that get started has status pattern [stopped -> pending start -> started]', function(done){
            let statusGenerator = function * () {
                yield status.stopped;
                yield status.pendingStart;
                return status.started;
            }
            let statusSequence = statusGenerator();
            spawnWatch._status.subscribe(currentStatus => {
                let iteration = statusSequence.next();
                expect(spawnWatch.processStatus).to.be.equal(iteration.value);
                if(iteration.done) {
                    expect(spawnWatch._childProcess).to.exist;
                    expect(spawnWatch._currentConfig).to.exist;
                    done();
                }
            });            
            spawnWatch.start(testConfigs.fastEndingConfig);
        });
        it('an instance that get stopped has status pattern [started -> pending stop -> stopped]', function(done){
            let statusGenerator = function * () {
                yield status.stopped;
                yield status.pendingStart;
                yield status.started;
                yield status.pendingStop;
                return status.stopped;
            }
            let statusSequence = statusGenerator();
            spawnWatch._status.subscribe(currentStatus => {
                let iteration = statusSequence.next();
                expect(spawnWatch.processStatus).to.be.equal(iteration.value);
                if(iteration.value === status.started) {
                    expect(spawnWatch._childProcess).to.exist;
                    expect(spawnWatch._currentConfig).to.exist;
                    spawnWatch.stop();
                }
                if(iteration.done) {
                    expect(spawnWatch._childProcess).to.not.exist;
                    expect(spawnWatch._currentConfig).to.not.exist;
                    done();
                }
            });
            spawnWatch.start(testConfigs.durationConfig);
        });
        it('an instance that get restarted has status pattern [started -> pending stop -> stopped -> pending start -> started]', function(done){
            let hasRestarted = false;
            let slightlyDiffConfig = Object.assign({}, testConfigs.durationConfig);
            slightlyDiffConfig.options = { fakeOptions: true };
            let statusGenerator = function * () {
                //setup
                yield status.stopped;
                yield status.pendingStart;
                //test
                yield status.started;
                yield status.pendingStop;
                yield status.stopped;
                yield status.pendingStart;
                return status.started;
            }
            let statusSequence = statusGenerator();
            spawnWatch._status.subscribe(currentStatus => {
                let iteration = statusSequence.next();
                expect(spawnWatch.processStatus).to.be.equal(iteration.value);
                if(iteration.value === status.started) {
                    expect(spawnWatch._childProcess).to.exist;
                    expect(spawnWatch._currentConfig).to.exist;
                    if(!hasRestarted) {
                        //restart with slightly modified config
                        spawnWatch.restart(slightlyDiffConfig);
                        hasRestarted = true;
                    }
                }
                if(iteration.done) {
                    expect(spawnWatch._childProcess).to.exist;
                    expect(spawnWatch._currentConfig).to.exist;
                    expect(spawnWatch._currentConfig).to.equal(slightlyDiffConfig);
                    done();
                }
            });
            spawnWatch.start(testConfigs.durationConfig);
        });
    });
    describe(`spawn-watch currentConfig`, function() {
        it('getter method currentConfig provide a valid config when started', function(){
            const minimalConfigChecker  = require('../lib/constants').minimalConfigChecker;
            spawnWatch.start(testConfigs.fastEndingConfig);
            expect(minimalConfigChecker(spawnWatch.currentConfig)).to.equal(true);
        });
    });
    describe(`spawn-watch processEventStream`, function() {
        it('getter method processEventStream provide a stream', function(){
            expect(spawnWatch.processEventStream).to.exist.and.to.be.an.instanceof(Rx.Observable);
        });
        it('spawned process evts are captured', function(done){
            //same test than previous one but this time on public process stream (no behavior subject)
            let statusGenerator = function * () {
                yield status.pendingStart;
                yield status.started;
                yield status.pendingStop;
                return status.stopped;
            }
            let statusSequence = statusGenerator();
            spawnWatch.processEventStream.subscribe((evt)=>{
                let iteration = statusSequence.next();
                expect(evt).to.be.equal(iteration.value);
                if(iteration.value === status.started) {
                    spawnWatch.stop();
                }
                if(iteration.done) {
                    done();
                }
            });
            spawnWatch.start(testConfigs.fastEndingConfig);
        });
    });
    describe(`spawn-watch outEventStream`, function() {
        it('getter method outEventStream provide a stream', function(){
            expect(spawnWatch.outEventStream).to.exist.and.to.be.an.instanceof(Rx.Observable);
        });
        it('spawned process stdout evts are captured', function(done){
            let once = false;
            spawnWatch.outEventStream.subscribe((data)=>{
                expect(data).to.exist;
                if(!once) done();
                once = true;
            });
            spawnWatch.start(testConfigs.fastEndingConfig);
        });
    });
    describe(`spawn-watch errorStream`, function() {
        it('getter method errorStream provide an event stream', function(){
            expect(spawnWatch.errorStream).to.exist.and.to.be.an.instanceof(Rx.Observable);
        });
        it('an instance that throw an error emits an error evt via this stream before closing', function(done){
            let hasReceivedError = false;
            spawnWatch.errorStream.subscribe((err)=>{
                hasReceivedError = true;
                console.log(err);
            });
            spawnWatch.processEventStream.subscribe((evt)=>{
                if(hasReceivedError && evt === status.stopped) done();
            });
            spawnWatch.start(testConfigs.errorGeneratingCommandConfig);
        });
    });
    describe(`spawn-watch ipcStream`, function() {
        it('getter method ipcStream provide an event stream (always accessible but will only emit if IPC enabled)', function(){
            expect(spawnWatch.ipcStream).to.exist.and.to.be.an.instanceof(Rx.Observable);
        });
    });
});
describe('spawn-watch ipc channel testing (enabled via spawnwatch instance config)', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        let ipcOption = { ipc:true }
        spawnWatch = new SpawnWatch(ipcOption);
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });
    
    it('get JSON output from parent to child', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.outEventStream.subscribe(log => {
            //test if received log contains stringified json
            expect(log.indexOf(JSON.stringify(testJson))).to.not.equal(-1);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
    it('get JSON output from child to parent', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.ipcStream.subscribe(ipcMsg => {
            //test if received log contains stringified json
            expect(ipcMsg).to.deep.equal(testJson);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
})
describe('spawn-watch ipc channel testing (enabled by extending stdio config)', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        let ipcOption = { ipc:true }
        spawnWatch = new SpawnWatch(ipcOption);
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });
    
    it('get JSON output from parent to child', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.outEventStream.subscribe(log => {
            //test if received log contains stringified json
            expect(log.indexOf(JSON.stringify(testJson))).to.not.equal(-1);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandAlternateBisConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
    it('get JSON output from child to parent', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.ipcStream.subscribe(ipcMsg => {
            //test if received log contains stringified json
            expect(ipcMsg).to.deep.equal(testJson);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandAlternateBisConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
})
describe('spawn-watch ipc channel testing (enabled via process config)', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        spawnWatch = new SpawnWatch();
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });
    
    it('get JSON output from parent to child', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.outEventStream.subscribe(log => {
            //test if received log contains stringified json
            expect(log.indexOf(JSON.stringify(testJson))).to.not.equal(-1);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandAlternateConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
    it('get JSON output from child to parent', function(done){
        let testJson = { test:'ipc', with:'JSON object' };
        spawnWatch.ipcStream.subscribe(ipcMsg => {
            //test if received log contains stringified json
            expect(ipcMsg).to.deep.equal(testJson);
            done();
        });
        spawnWatch.start(testConfigs.ipcCommandAlternateConfig);
        expect(spawnWatch.ipcInput(testJson)).to.equal(true);
    });
})
describe('spawn-watch ansi color encoding testing', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        let encodingOption = { ipc:true };
        spawnWatch = new SpawnWatch(encodingOption);
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });

    it('stdin | stdout | stderr are enabling colors', function(done){
        let results = {
            stdin: undefined,
            stdout: undefined,
            stderr: undefined
        };
        let checkTestEnd = function(results) {
            if(results.stdin && results.stdout && results.stderr) {
                expect(hasAnsi(results.stdin)).to.equal(true);
                expect(hasAnsi(results.stdout)).to.equal(true);
                expect(hasAnsi(results.stderr)).to.equal(true);
                done();
            }
        };
        spawnWatch.outEventStream.subscribe(log => {
            //console.log(log);
            results.stdout = log;
            checkTestEnd(results);
        });
        spawnWatch.errorStream.subscribe(err => {
            //console.log(err);
            results.stderr = err;
            checkTestEnd(results);
        })
        spawnWatch.ipcStream.subscribe(msg => {
            //console.log(msg);
            results.stdin = msg;
            checkTestEnd(results);
        })
        spawnWatch.start(testConfigs.ansiCommandConfig);
        spawnWatch.input(chalk.green('TEST STDIN'));
    });
})
describe('spawn-watch stream encoding testing (ascii)', function() {
    var spawnWatch;

    beforeEach(function() {
        // runs before each test in this block
        let encodingOption = { encodings:{ stdin:'ascii', stdout:'ascii', stderr:'ascii' } };
        spawnWatch = new SpawnWatch(encodingOption);
    });

    afterEach(function(done) {
        afterTestEventualKillProcess(spawnWatch, done);
    });

    it('stdin | stdout | stderr are ascii encoded', function(done){
        let results = {
            stdin: undefined,
            stdout: undefined,
            stderr: undefined
        };
        let checkTestEnd = function(results) {
            if(results.stdin && results.stdout && results.stderr) {
                expect(results.stdin.indexOf('éàù@#')).to.equal(-1);
                expect(results.stdout.indexOf('éàù@#')).to.equal(-1);
                expect(results.stderr.indexOf('éàù@#')).to.equal(-1);
                done();
            }
        };
        spawnWatch.outEventStream.subscribe(log => {
            //console.log(log);
            if(log.indexOf('STDIN') > -1) {
                results.stdin = log;
            } else if(log.indexOf('STDOUT') > -1) {
                results.stdout = log;
            }
            checkTestEnd(results);
        });
        spawnWatch.errorStream.subscribe(err => {
            //console.log(err);
            results.stderr = err;
            checkTestEnd(results);
        })
        spawnWatch.start(testConfigs.asciiCommandConfig);
        spawnWatch.input(chalk.green('TEST ASCII STDIN éàù@#'));
    });
})

let afterTestEventualKillProcess = function(spawnWatch, done) {
    //kill process
    if(spawnWatch._childProcess) {
        spawnWatch._childProcess.removeAllListeners();
        kill(spawnWatch._childProcess.pid, 'SIGKILL', (err) => {
            //if(err) console.log(err.toString());
            spawnWatch = null;
            done();
        });
    } else {
        spawnWatch = null;
        done();
    }
};