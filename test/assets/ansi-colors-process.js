'use strict'

//enables colored outputs from child process
const chalk             = require('chalk');
const ctx = new chalk.constructor({enabled: true});

//ansi will be used hopefully
process.stdin.on('data', function (buffer) {
    process.send(buffer.toString());
    let errMsg = ctx.red('TEST ANSI ERROR');
    throw new Error(errMsg);
});
console.log(ctx.yellow('TEST ANSI STDOUT'));