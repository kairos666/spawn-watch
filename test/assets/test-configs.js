'use strict'

let fastEndingConfig = {
    command: 'node',
    args: ['-v'],
    options: {}
};

let durationConfig = {
    command: 'node',
    args: ['test/assets/interval-process.js'],
    options: {}
};

let invalidConfig = {
    command: 'node'
};

let badCommandConfig = {
    command: 'bad command',
    args: [],
    options: {}
};

let errorGeneratingCommandConfig = {
    command: 'node',
    args: ['test/assets/error-process.js'],
    options: {}
};

let inputCommandConfig = {
    command: 'node',
    args: ['test/assets/input-process.js'],
    options: {}
};

module.exports = {
    fastEndingConfig: fastEndingConfig,
    invalidConfig: invalidConfig,
    badCommandConfig: badCommandConfig,
    durationConfig: durationConfig,
    errorGeneratingCommandConfig: errorGeneratingCommandConfig,
    inputCommandConfig: inputCommandConfig
}