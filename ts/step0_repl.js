"use strict";
var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
var READ = function (input) { return input; };
var EVAL = function (input) { return input; };
var PRINT = function (input) { return input; };
var rep = function (input) { return PRINT(EVAL(READ(input))); };
process.stdout.write('user> ');
rl.on('line', function (line) {
    console.log(rep(line));
    process.stdout.write('user> ');
});
