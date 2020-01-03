"use strict";
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
var repl_env = {
    "+": {
        type: "function",
        value: function (a, b) { return ({
            type: "number",
            value: a + b
        }); }
    },
    "-": {
        type: "function",
        value: function (a, b) { return ({
            type: "number",
            value: a - b
        }); }
    },
    "*": {
        type: "function",
        value: function (a, b) { return ({
            type: "number",
            value: a * b
        }); }
    },
    "/": {
        type: "function",
        value: function (a, b) { return ({
            type: "number",
            value: a / b
        }); }
    }
};
var eval_ast = function (ast, env) {
    if (ast.type === "symbol") {
        var val = env[ast.value];
        if (val === undefined) {
            return {
                type: "symbol",
                value: "erreur"
            };
        }
        return val;
    }
    if (ast.type === "list") {
        return {
            type: "list",
            value: ast.value.map(function (val) { return EVAL(val, env); })
        };
    }
    return ast;
};
var EVAL = function (ast, env) {
    var _a;
    if (ast.type !== "list") {
        return eval_ast(ast, env);
    }
    if (ast.value.length === 0) {
        return ast;
    }
    var evaluated = eval_ast(ast, env);
    if (evaluated.type !== "list") {
        throw new Error("Should be a list");
    }
    if (evaluated.value[0].type !== "function") {
        return {
            type: "symbol",
            value: "erreur"
        };
    }
    return (_a = evaluated.value[0]).value.apply(_a, evaluated.value.slice(1).map(function (el) { return el.value; }));
};
var rep = function (input) { return printer_1.pr_str(EVAL(reader_1.read_str(input), repl_env)); };
process.stdout.write("user> ");
rl.on("line", function (line) {
    console.log(rep(line));
    process.stdout.write("user> ");
});
module.exports = {};
