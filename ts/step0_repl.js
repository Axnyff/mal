"use strict";
var readline = require("readline");
var rep = function (input) {
    return input;
};
process.stdout.write("user> ");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
rl.on("line", function (line) {
    console.log(rep(line));
    process.stdout.write("user> ");
});
