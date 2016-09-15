'use strict'

//ascii will be used hopefully
process.stdin.on('data', function (buffer) {
    console.log(buffer.toString());
    let errMsg = 'TEST ASCII ERROR éàù@#';
    throw new Error(errMsg);
});
console.log('TEST ASCII STDOUT éàù@#');