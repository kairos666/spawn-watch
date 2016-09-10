'use strict'

setInterval(function(){ 
    let err = new Error('TEST ERROR');
    throw err; 
}, 200);