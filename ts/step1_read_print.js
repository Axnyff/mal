"use strict";
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
var EVAL = function (input) { return input; };
var rep = function (input) { return printer_1.pr_str(EVAL(reader_1.read_str(input))); };
process.stdout.write("user> ");
rl.on("line", function (line) {
    console.log(rep(line));
    process.stdout.write("user> ");
});
module.exports = {};
