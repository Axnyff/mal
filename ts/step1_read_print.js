"use strict";
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var env_1 = require("./env");
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
var repl_env = new env_1.Env();
var eval_ast = function (ast, env) {
    if (ast.type === "symbol") {
        try {
            var val = env.get(ast.value);
            return val;
        }
        catch (err) {
            return {
                type: "error",
                value: ".*'" + ast.value + "' not found.*'"
            };
        }
    }
    if (ast.type === "list") {
        return {
            type: "list",
            value: ast.value.map(function (val) { return EVAL(val, env); })
        };
    }
    return ast;
};
var isPair = function (ast) {
    return ast.type === "list" && ast.value.length !== 0;
};
var quasiquote = function (ast) {
    if (!isPair(ast)) {
        return {
            type: "list",
            value: [
                {
                    type: "symbol",
                    value: "quote"
                },
                ast
            ]
        };
    }
    if (ast.value[0].value === "unquote") {
        return ast.value[1];
    }
    if (isPair(ast.value[0])) {
        if (ast.value[0].value[0].value === "splice-unquote") {
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "concat"
                    },
                    ast.value[0].value[1],
                    quasiquote({ type: "list", value: ast.value.slice(1) })
                ]
            };
        }
    }
    return {
        type: "list",
        value: [
            {
                type: "symbol",
                value: "cons"
            },
            quasiquote(ast.value[0]),
            quasiquote({ type: "list", value: ast.value.slice(1) })
        ]
    };
};
var EVAL = function (ast, env) {
    return ast;
};
var rep = function (input) {
    return console.log(printer_1.pr_str(EVAL(reader_1.read_str(input), repl_env)));
};
process.stdout.write("user> ");
rl.on("line", function (line) {
    rep(line);
    process.stdout.write("user> ");
});
module.exports = {};
