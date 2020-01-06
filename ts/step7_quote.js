"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var env_1 = require("./env");
var core_1 = require("./core");
var readline = require("readline");
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
repl_env.set("eval", {
    type: "function",
    value: {
        fn: function (ast) { return EVAL(ast, repl_env); }
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
    if (ast.type === "vector") {
        return {
            type: "vector",
            value: ast.value.map(function (val) { return EVAL(val, env); })
        };
    }
    if (ast.type === "map") {
        return {
            type: "map",
            value: Object.entries(ast.value).reduce(function (acc, _a) {
                var key = _a[0], val = _a[1];
                acc[key] = EVAL(val, env);
                return acc;
            }, {})
        };
    }
    return ast;
};
var isPair = function (ast) {
    return (ast.type === "vector" || ast.type === "list") && ast.value.length !== 0;
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
    var i = 0;
    var _loop_1 = function () {
        var _a;
        if (ast.type !== "list") {
            return { value: eval_ast(ast, env) };
        }
        if (ast.value.length === 0) {
            return { value: ast };
        }
        if (ast.value[0].value === "quote") {
            return { value: ast.value[1] };
        }
        if (ast.value[0].value === "quasiquote") {
            ast = quasiquote(ast.value[1]);
            return "continue";
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
            if (ast.value[1].type !== "list" && ast.value[1].type !== "vector") {
                throw new Error("Bindings should be a list");
            }
            var bindings = ast.value[1].value;
            if (bindings.length % 2 !== 0) {
                throw new Error("Bindings should not be odd length");
            }
            var i_1 = 0;
            while (i_1 < bindings.length) {
                if (bindings[i_1].type !== "symbol") {
                    throw new Error("Bindings should be a symbol");
                }
                else {
                    new_env.set(bindings[i_1].value, EVAL(bindings[i_1 + 1], new_env));
                }
                i_1 += 2;
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
            if (bindings_1.type !== "list" && bindings_1.type !== "vector") {
                return { value: {
                        type: "error",
                        value: "Function bindings should be a list"
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
                                for (var i_2 = 0; i_2 < args.length; i_2++) {
                                    if (bindings_1.value[i_2].type !== "symbol") {
                                        return {
                                            type: "error",
                                            value: "Function bindings should all be args"
                                        };
                                    }
                                    new_env.set(bindings_1.value[i_2].value, args[i_2]);
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
            var args_1 = evaluated.value.slice(1);
            ast = fnValue.ast;
            var new_env = new env_1.Env(fnValue.env);
            for (var i_3 = 0; i_3 < fnValue.params.value.length; i_3++) {
                if (fnValue.params.value[i_3].type !== "symbol") {
                    return { value: {
                            type: "error",
                            value: "Function bindings should all be args"
                        } };
                }
                // variadic arguments
                if (fnValue.params.value[i_3].value === "&") {
                    new_env.set(fnValue.params.value[i_3 + 1].value, {
                        type: "list",
                        value: args_1.slice(i_3)
                    });
                    break;
                }
                else {
                    new_env.set(fnValue.params.value[i_3].value, args_1[i_3]);
                }
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
rep("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\\nnil)\")))))");
rep("(def! not (fn* (a) (if a false true)))");
var filenameIndex = process.argv.indexOf(__filename);
var args = process.argv.slice(filenameIndex + 1);
repl_env.set("*ARGV*", {
    type: "list",
    value: []
});
if (args.length >= 1) {
    if (args.length > 1) {
        repl_env.set("*ARGV*", {
            type: "list",
            value: args.slice(1).map(function (item) { return ({
                type: "string",
                value: item
            }); })
        });
    }
    rep("(load-file \"" + args[0] + "\")");
}
else {
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
}
