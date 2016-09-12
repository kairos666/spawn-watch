'use strict'

process.on('message', data => {
    //from ipc to sdout
    console.log(`received data from ipc channel send it back through stdout stringified ${JSON.stringify(data)}`);
    //from ipc to ipc
    process.send(data);
});

process.on('disconnect', () => {
    console.log('disconnect evt received via ipc channel');
});