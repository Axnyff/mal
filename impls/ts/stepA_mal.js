"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var env_1 = require("./env");
var core_1 = require("./core");
var node_readline_1 = require("./node_readline");
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
        return env.get(ast.value);
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
var isMacroCall = function (ast, env) {
    if (isPair(ast)) {
        if (ast.value[0].type == "symbol") {
            try {
                var value = env.get(ast.value[0].value);
                return value.type === "function" && value.is_macro === true;
            }
            catch (e) {
                return false;
            }
        }
    }
    return false;
};
var macroexpand = function (ast, env) {
    var _a;
    while (isMacroCall(ast, env)) {
        if (ast.value[0].type !== "symbol") {
            throw new Error("Should be a symbol");
        }
        var new_ast = env.get(ast.value[0].value);
        if (new_ast.type !== "function" || !new_ast.value.params) {
            throw new Error("Should be a custom func");
        }
        ast = (_a = new_ast.value).fn.apply(_a, ast.value.slice(1));
    }
    return ast;
};
var EVAL = function (ast, env) {
    var _loop_1 = function () {
        var _a;
        ast = macroexpand(ast, env);
        if (ast.type !== "list") {
            return { value: eval_ast(ast, env) };
        }
        if (ast.value.length === 0) {
            return { value: ast };
        }
        if (ast.value[0].value === "try*") {
            try {
                return { value: EVAL(ast.value[1], env) };
            }
            catch (e) {
                if (ast.value.length < 3) {
                    throw e;
                }
                if (ast.value[2].type !== "list") {
                    throw new Error("should be a list");
                }
                var _b = ast.value[2].value, errorName = _b[1], content = _b[2];
                if (errorName.type !== "symbol") {
                    throw new Error("should be a symbol");
                }
                var new_env = new env_1.Env(env);
                if (e instanceof Error) {
                    e = {
                        type: "string",
                        value: e.message
                    };
                }
                new_env.set(errorName.value, e);
                return { value: EVAL(content, new_env) };
            }
        }
        if (ast.value[0].value === "quote") {
            return { value: ast.value[1] };
        }
        if (ast.value[0].value === "macroexpand") {
            return { value: macroexpand(ast.value[1], env) };
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
        if (ast.value[0].value === "defmacro!") {
            if (ast.value[1].type !== "symbol") {
                throw new Error("Should be a symbol");
            }
            var evaluated_2 = EVAL(ast.value[2], env);
            if (evaluated_2.type !== "function") {
                throw new Error("should be a func");
            }
            env.set(ast.value[1].value, __assign(__assign({}, evaluated_2), { is_macro: true }));
            return { value: evaluated_2 };
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
            ast.value.slice(1, -1).map(function (val) { return EVAL(val, env); });
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
                throw new Error("Function bindings should be a list");
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
                            var new_env = new env_1.Env(env);
                            for (var i = 0; i < bindings_1.value.length; i++) {
                                if (bindings_1.value[i].type !== "symbol") {
                                    throw new Error("Function bindings should be a list");
                                }
                                // variadic arguments
                                if (bindings_1.value[i].value === "&") {
                                    new_env.set(bindings_1.value[i + 1].value, {
                                        type: "list",
                                        value: args.slice(i)
                                    });
                                    break;
                                }
                                else {
                                    new_env.set(bindings_1.value[i].value, args[i]);
                                }
                            }
                            return EVAL(content_1, new_env);
                        }
                    }
                } };
        }
        var evaluated = eval_ast(ast, env);
        if (evaluated.type !== "list") {
            throw new Error("Should be a list");
        }
        if (evaluated.value[0].type === "error") {
            return { value: evaluated.value[0] };
        }
        if (evaluated.value[0].type !== "function") {
            throw new Error("Should be a function");
        }
        var fnValue = evaluated.value[0].value;
        if (fnValue.params) {
            var args_1 = evaluated.value.slice(1);
            ast = fnValue.ast;
            var new_env = new env_1.Env(fnValue.env);
            for (var i = 0; i < fnValue.params.value.length; i++) {
                if (fnValue.params.value[i].type !== "symbol") {
                    throw new Error("Function bindings should all be args");
                }
                // variadic arguments
                if (fnValue.params.value[i].value === "&") {
                    new_env.set(fnValue.params.value[i + 1].value, {
                        type: "list",
                        value: args_1.slice(i)
                    });
                    break;
                }
                else {
                    new_env.set(fnValue.params.value[i].value, args_1[i]);
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
var rep = function (input) {
    try {
        return printer_1.pr_str(EVAL(reader_1.read_str(input, true), repl_env));
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
rep("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\\nnil)\")))))");
rep("(def! not (fn* (a) (if a false true)))");
rep("(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))");
var filenameIndex = process.argv.indexOf(__filename);
var args = process.argv.slice(filenameIndex + 1);
repl_env.set("*host-language*", {
    type: "string",
    value: "ts",
});
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
    while (true) {
        var line = node_readline_1.readline('user> ');
        if (line === null) {
            break;
        }
        if (line === "") {
            continue;
        }
        console.log(rep(line));
    }
}
