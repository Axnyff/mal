"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var printer_1 = require("./printer");
var reader_1 = require("./reader");
var prn = function (arg) {
    console.log(printer_1.pr_str(arg, true));
    return {
        type: "nil"
    };
};
var list = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return {
        type: "list",
        value: args
    };
};
var is_list = function (arg) {
    return {
        type: "bool",
        value: arg.type === "list"
    };
};
var is_empty = function (arg) {
    return {
        type: "bool",
        value: count(arg).value === 0
    };
};
var count = function (arg) {
    if (arg.type === "nil") {
        return {
            type: "number",
            value: 0
        };
    }
    if (arg.type !== "list") {
        return {
            type: "error",
            value: "empty? should be called on a list"
        };
    }
    return {
        type: "number",
        value: arg.value.length
    };
};
var _equal = function (a, b) {
    if (a.type !== b.type) {
        return false;
    }
    if (a.type !== "list" || b.type !== "list") {
        return a.value === b.value;
    }
    if (a.value.length !== b.value.length) {
        return false;
    }
    for (var i = 0; i < a.value.length; i++) {
        if (!_equal(a.value[i], b.value[i])) {
            return false;
        }
    }
    return true;
};
var equal = function (a, b) {
    return {
        type: "bool",
        value: _equal(a, b)
    };
};
var buildCompFn = function (fn) { return function (arg1, arg2) {
    if (arg1.type !== "number" || arg2.type !== "number") {
        return {
            type: "error",
            value: "numeric function called with non numbers"
        };
    }
    return {
        type: "bool",
        value: fn(arg1.value, arg2.value)
    };
}; };
var less = buildCompFn(function (a, b) { return a < b; });
var less_or_equal = buildCompFn(function (a, b) { return a <= b; });
var more = buildCompFn(function (a, b) { return a > b; });
var more_or_equal = buildCompFn(function (a, b) { return a >= b; });
var atom = function (value) { return ({
    type: "atom",
    value: value
}); };
var is_atom = function (value) { return ({
    type: "bool",
    value: value.type === 'atom',
}); };
var deref = function (atom) { return atom.value; };
var do_reset = function (atom, value) {
    atom.value = value;
    return value;
};
var do_swap = function (atom, func) {
    var _a;
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    atom.value = (_a = func.value).fn.apply(_a, __spreadArrays([atom.value], args));
    return atom.value;
};
var cons = function (ast, list) { return ({
    type: 'list',
    value: __spreadArrays([ast], list.value),
}); };
var concat = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return ({
        type: 'list',
        value: args.reduce(function (acc, _a) {
            var value = _a.value;
            return acc.concat(value);
        }, []),
    });
};
exports.ns = {
    prn: {
        type: "function",
        value: { fn: prn }
    },
    list: {
        type: "function",
        value: { fn: list }
    },
    "list?": {
        type: "function",
        value: { fn: is_list }
    },
    "empty?": {
        type: "function",
        value: { fn: is_empty }
    },
    count: {
        type: "function",
        value: { fn: count }
    },
    "<": {
        type: "function",
        value: { fn: less }
    },
    "<=": {
        type: "function",
        value: { fn: less_or_equal }
    },
    ">": {
        type: "function",
        value: { fn: more }
    },
    ">=": {
        type: "function",
        value: { fn: more_or_equal }
    },
    "=": {
        type: "function",
        value: { fn: equal }
    },
    str: {
        type: "function",
        value: {
            fn: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return ({
                    type: "string",
                    value: args.map(function (arg) { return printer_1.pr_str(arg, false); }).join("")
                });
            }
        }
    },
    "read-string": {
        type: "function",
        value: { fn: function (a) { return reader_1.read_str(a.value); } }
    },
    slurp: {
        type: "function",
        value: {
            fn: function (filename) {
                try {
                    var content = fs_1.default.readFileSync(filename.value);
                    return {
                        type: "string",
                        value: content.toString().replace(/\n/g, "\\n"),
                    };
                }
                catch (err) {
                    return {
                        type: "error",
                        value: "File " + filename.value + " not found"
                    };
                }
            }
        }
    },
    atom: {
        type: "function",
        value: { fn: atom }
    },
    "atom?": {
        type: "function",
        value: { fn: is_atom }
    },
    "deref": {
        type: "function",
        value: { fn: deref }
    },
    "reset!": {
        type: "function",
        value: { fn: do_reset }
    },
    "swap!": {
        type: "function",
        value: { fn: do_swap }
    },
    "cons": {
        type: "function",
        value: { fn: cons }
    },
    "concat": {
        type: "function",
        value: { fn: concat }
    },
};
