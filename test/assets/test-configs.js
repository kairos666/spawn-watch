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

let ipcCommandConfig = {
    command: 'node',
    args: ['test/assets/ipc-process.js'],
    options: {}
};

let ipcCommandAlternateConfig = {
    command: 'node',
    args: ['test/assets/ipc-process.js'],
    options: {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    }
};

let ipcCommandAlternateBisConfig = {
    command: 'node',
    args: ['test/assets/ipc-process.js'],
    options: {
        stdio: ['pipe', null, null]
    }
};

let ansiCommandConfig = {
    command: 'node',
    args: ['test/assets/ansi-colors-process.js'],
    options: {}
};

let asciiCommandConfig = {
    command: 'node',
    args: ['test/assets/ascii-process.js'],
    options: {}
};

module.exports = {
    fastEndingConfig: fastEndingConfig,
    invalidConfig: invalidConfig,
    badCommandConfig: badCommandConfig,
    durationConfig: durationConfig,
    errorGeneratingCommandConfig: errorGeneratingCommandConfig,
    inputCommandConfig: inputCommandConfig,
    ipcCommandConfig: ipcCommandConfig,
    ipcCommandAlternateConfig: ipcCommandAlternateConfig,
    ipcCommandAlternateBisConfig: ipcCommandAlternateBisConfig,
    ansiCommandConfig: ansiCommandConfig,
    asciiCommandConfig: asciiCommandConfig
}