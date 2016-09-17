# spawn-watch
Simple spawn process helper for creation &amp; monitoring

## Install
```console
npm install spawn-watch
```

## Usage
```javascript
const SpawnWatch = require('spawn-watch');

initOptions = {
    ipc:true,
    encodings:{
        stdin:'ascii',
        stdout:'utf-8',
        stderr:'ascii'
    }
};

config = {
    command: 'node',    //command to run (required)
    args: ['-v'],       //List of string arguments (require at least [])
    options: {}         //List of options (require at least {})
};

//init (options are not required)
let spawnWatch = new SpawnWatch(initOptions);

//subscribe to error observable
spawnWatch.errorStream.subscribe(err => {
    console.log('got errors meeehhh', err);
});

//subscribe to stdout observable
spawnWatch.outEventStream.subscribe(data => {
    console.log('got data output', data);
});

//subscribe to spawn-watch status updates observable
spawnWatch.processEventStream.subscribe(status => {
    console.log('got status', status);
});

//subscribe to spawn-watch IPC observable
spawnWatch.ipcStream.subscribe(msg => {
    console.log('got IPC msg', msg);
});

//spawn process
spawnWatch.start(config);
```

## methods
Ease handling of spawned child processes with simple interface.
* **spawnWatch.start(config)** - spawn a process with the given [configuration](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
* **spawnWatch.stop()** - exit a process (and sub processes)
* **spawnWatch.restart([config])** - exit some previously started process and spawn a new one afterwards. config is optional, if not provided the process will restart with the same config as the previous process.

## outputs
stdout, stderr are piped to spawn-watch observables [RXJS](http://reactivex.io/documentation/operators.html) so you can subscribe even before any process is spawned. That way there is no need to micro-manage listeners.
* **spawnWatch.outEventStream.subscribe(function(){})** - stdout data is piped to this observable
* **spawnWatch.errorStream.subscribe(function(){})** - stderr & process.on('error') are piped to this observable
* **spawnWatch.ipcStream.subscribe(function(){})** - receive process.send() data from the child process in this observable (need an IPC channel to emit something). 

## inputs
* **spawnWatch.input(data)** function that handle writing to stdin for you. Sending strings or JSON to the spawned process
* **spawnWatch.ipcInput(data)** function that use an IPC channel to send data from parent to child process. Will return false if no IPC channel is set.

## other
You can get the state of the spawned process at any given moment, subscribe to the process state stream, or retrieve the config that was applied to spawn this process.
* **spawnWatch.processEventStream.subscribe(function(){})** - observable emitting the status changes over time [stopped, started, pending start, pending stop]
* **spawnWatch.processStatus** - status property
* **spawnWatch.currentConfig** - get config of current process

## constructor options
Here are the option object properties you can pass to the SpawnWatch constructor

property | type | default value | comment
------------ | ------------- | ------------- | -------------
ipc | [boolean] | false | enables an ipc channel between parent and child process. Alternatively you can define it with the options.stdio property at the child process config level.
encodings.stdin | [string] | 'utf-8' | encoding of the process stream. See [node doc](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) for supported encodings.
encodings.stdout | [string] | 'utf-8' | encoding of the process stream. See [node doc](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) for supported encodings.
encodings.stderr | [string] | 'utf-8' | encoding of the process stream. See [node doc](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) for supported encodings. 