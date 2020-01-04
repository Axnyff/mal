"use strict";
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var env_1 = require("./env");
var core_1 = require("./core");
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});
var repl_env = new env_1.Env();
repl_env.set("+", {
    type: "function",
    value: {
        fn: function (a, b) { return ({
            type: "number",
            value: a.value + b.value
        }); }
    }
});
repl_env.set("-", {
    type: "function",
    value: {
        fn: function (a, b) { return ({
            type: "number",
            value: a.value - b.value
        }); }
    }
});
repl_env.set("*", {
    type: "function",
    value: {
        fn: function (a, b) { return ({
            type: "number",
            value: a.value * b.value
        }); }
    }
});
repl_env.set("/", {
    type: "function",
    value: {
        fn: function (a, b) { return ({
            type: "number",
            value: a.value / b.value
        }); }
    }
});
Object.entries(core_1.ns).forEach(function (_a) {
    var key = _a[0], value = _a[1];
    return repl_env.set(key, value);
});
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
var EVAL = function (ast, env) {
    var _loop_1 = function () {
        var _a;
        if (ast.type !== "list") {
            return { value: eval_ast(ast, env) };
        }
        if (ast.value.length === 0) {
            return { value: ast };
        }
        if (ast.value[0].value === "def!") {
            if (ast.value[1].type !== "symbol") {
                throw new Error("Should be a symbol");
            }
            var evaluated_1 = EVAL(ast.value[2], env);
            if (evaluated_1.type !== "error") {
                env.set(ast.value[1].value, evaluated_1);
            }
            return { value: evaluated_1 };
        }
        if (ast.value[0].value === "let*") {
            var new_env = new env_1.Env(env);
            if (ast.value[1].type !== "list") {
                throw new Error("Bindings should be a list");
            }
            var bindings = ast.value[1].value;
            if (bindings.length % 2 !== 0) {
                throw new Error("Bindings should not be odd length");
            }
            var i = 0;
            while (i < bindings.length) {
                if (bindings[i].type !== "symbol") {
                    throw new Error("Bindings should be a symbol");
                }
                else {
                    new_env.set(bindings[i].value, EVAL(bindings[i + 1], new_env));
                }
                i += 2;
            }
            ast = ast.value[2];
            env = new_env;
            return "continue";
        }
        if (ast.value[0].value === "do") {
            var evaluated_2 = ast.value.slice(1, -1).map(function (val) { return EVAL(val, env); });
            ast = ast.value[ast.value.length - 1];
            return "continue";
        }
        if (ast.value[0].value === "if") {
            var cond = EVAL(ast.value[1], env);
            if (cond.value !== false && cond.type !== "nil") {
                ast = ast.value[2];
            }
            else if (ast.value.length === 4) {
                ast = ast.value[3];
            }
            else {
                ast = {
                    type: "nil"
                };
            }
            return "continue";
        }
        if (ast.value[0].value === "fn*") {
            var bindings_1 = ast.value[1];
            var content_1 = ast.value[2];
            if (bindings_1.type !== "list" || content_1.type !== "list") {
                return { value: {
                        type: "error",
                        value: "Function bindings and content should be a list"
                    } };
            }
            return { value: {
                    type: "function",
                    value: {
                        params: bindings_1,
                        ast: content_1,
                        env: env,
                        fn: function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            try {
                                var new_env = new env_1.Env(env);
                                for (var i = 0; i < args.length; i++) {
                                    if (bindings_1.value[i].type !== "symbol") {
                                        return {
                                            type: "error",
                                            value: "Function bindings should all be args"
                                        };
                                    }
                                    new_env.set(bindings_1.value[i].value, args[i]);
                                }
                                return EVAL(content_1, new_env);
                            }
                            catch (e) {
                                return {
                                    type: "error",
                                    value: "Unexpected error"
                                };
                            }
                        }
                    }
                } };
        }
        var evaluated = eval_ast(ast, env);
        if (evaluated.type !== "list") {
            return { value: {
                    type: "error",
                    value: "Should be a function"
                } };
        }
        if (evaluated.value[0].type === "error") {
            return { value: evaluated.value[0] };
        }
        if (evaluated.value[0].type !== "function") {
            return { value: {
                    type: "error",
                    value: "Should be a function"
                } };
        }
        var fnValue = evaluated.value[0].value;
        if (fnValue.params) {
            var args = evaluated.value.slice(1);
            ast = fnValue.ast;
            var new_env = new env_1.Env(env);
            for (var i = 0; i < args.length; i++) {
                if (fnValue.params.value[i].type !== "symbol") {
                    return { value: {
                            type: "error",
                            value: "Function bindings should all be args"
                        } };
                }
                new_env.set(fnValue.params.value[i].value, args[i]);
            }
            env = new_env;
            return "continue";
        }
        return { value: (_a = evaluated.value[0].value).fn.apply(_a, evaluated.value.slice(1)) };
    };
    while (true) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
};
var rep = function (input) { return printer_1.pr_str(EVAL(reader_1.read_str(input), repl_env)); };
process.stdout.write("user> ");
rl.on("line", function (line) {
    console.log(rep(line));
    process.stdout.write("user> ");
});
module.exports = {};
