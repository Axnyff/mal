"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var readline = require("readline");
var rep = function (input) {
    try {
        return printer_1.pr_str(reader_1.read_str(input, true));
    }
    catch (e) {
        if (e instanceof Error) {
            return printer_1.pr_str({
                type: "string",
                value: ".*Error.*" + e.message
            }, false);
        }
        return ".*Error.*" + printer_1.pr_str(e);
    }
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
