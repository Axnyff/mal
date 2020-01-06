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
var prn = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log(args.map(function (arg) { return printer_1.pr_str(arg, true); }).join(" "));
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
var toBool = function (v) { return ({
    type: "bool",
    value: v
}); };
var is_list = function (arg) { return toBool(arg.type === "list"); };
var is_empty = function (arg) { return toBool(count(arg).value === 0); };
var count = function (arg) {
    if (arg.type === "nil") {
        return {
            type: "number",
            value: 0
        };
    }
    if (arg.type !== "list" && arg.type !== "vector") {
        throw new Error("count? should be called on a list");
    }
    return {
        type: "number",
        value: arg.value.length
    };
};
var isSeq = function (a) {
    return a.type === "list" || a.type === "vector";
};
var _equal = function (a, b) {
    if (isSeq(a) && isSeq(b)) {
        if (a.value.length !== b.value.length) {
            return false;
        }
        for (var i = 0; i < a.value.length; i++) {
            if (!_equal(a.value[i], b.value[i])) {
                return false;
            }
        }
        return true;
    }
    if (a.type !== b.type) {
        return false;
    }
    if (a.type === "map" && b.type === "map") {
        var keysA = Object.keys(a.value);
        var keysB = Object.keys(b.value);
        if (keysA.length !== keysB.length) {
            return false;
        }
        for (var _i = 0, keysA_1 = keysA; _i < keysA_1.length; _i++) {
            var key = keysA_1[_i];
            if (!keysB.includes(key)) {
                return false;
            }
            if (!_equal(a.value[key], b.value[key])) {
                return false;
            }
        }
        return true;
    }
    return a.value === b.value;
};
var equal = function (a, b) { return toBool(_equal(a, b)); };
var buildCompFn = function (fn) { return function (arg1, arg2) {
    if (arg1.type !== "number" || arg2.type !== "number") {
        throw new Error("numeric function called with non numbers");
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
    value: value.type === "atom"
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
    type: "list",
    value: __spreadArrays([ast], list.value)
}); };
var concat = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return ({
        type: "list",
        value: args.reduce(function (acc, _a) {
            var value = _a.value;
            return acc.concat(value);
        }, [])
    });
};
var nth = function (lst, index) {
    if (index.value >= lst.value.length) {
        throw new Error(".*Invalid range.*");
    }
    return lst.value[index.value];
};
var first = function (lst) {
    if (lst.type === "nil" || lst.value.length === 0) {
        return {
            type: "nil"
        };
    }
    return lst.value[0];
};
var rest = function (lst) {
    if (lst.type === "nil" || lst.value.length === 0) {
        return {
            type: "list",
            value: []
        };
    }
    return { type: "list", value: lst.value.slice(1) };
};
var apply = function (f) {
    var _a;
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var lastArg = args[args.length - 1];
    if (!isSeq(lastArg)) {
        throw new Error("");
    }
    var actualArgs = __spreadArrays(args.slice(0, -1), lastArg.value);
    return (_a = f.value).fn.apply(_a, actualArgs);
};
var map = function (f, col) {
    return {
        type: "list",
        value: col.value.map(f.value.fn)
    };
};
var is_nil = function (ast) { return toBool(ast.type === "nil"); };
var is_true = function (ast) { return toBool(ast.value === true); };
var is_false = function (ast) { return toBool(ast.value === false); };
var is_symbol = function (ast) { return toBool(ast.type === "symbol"); };
var symbol = function (ast) { return ({
    type: "symbol",
    value: ast.value
}); };
var keyword = function (ast) {
    return ast.type === "keyword"
        ? ast
        : {
            type: "keyword",
            value: "\u029E:" + ast.value
        };
};
var is_keyword = function (ast) { return toBool(ast.type === "keyword"); };
var vector = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return ({
        type: "vector",
        value: args
    });
};
var is_vector = function (ast) { return toBool(ast.type === "vector"); };
var hashmap = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var content = {};
    var i = 0;
    while (i < args.length) {
        var key = args[i];
        var value = args[i + 1];
        if (key.type !== "string" && key.type !== "keyword") {
            throw new Error("wrong key for map");
        }
        content[key.value] = value;
        i += 2;
    }
    return {
        type: "map",
        value: content
    };
};
var is_map = function (arg) { return toBool(arg.type === "map"); };
var assoc = function (map) {
    var keyValues = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keyValues[_i - 1] = arguments[_i];
    }
    var existingKeyValues = Object.entries(map.value).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        return __spreadArrays(acc, [
            {
                type: key.startsWith("\u029E") ? "keyword" : "string",
                value: key
            },
            value
        ]);
    }, []);
    return hashmap.apply(void 0, __spreadArrays(existingKeyValues, keyValues));
};
var dissoc = function (map) {
    var keyToRemove = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keyToRemove[_i - 1] = arguments[_i];
    }
    var remainingKeyValues = Object.entries(map.value).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        if (keyToRemove.some(function (_a) {
            var value = _a.value;
            return value === key;
        })) {
            return acc;
        }
        return __spreadArrays(acc, [
            {
                type: key.startsWith("\u029E") ? "keyword" : "string",
                value: key
            },
            value
        ]);
    }, []);
    return hashmap.apply(void 0, remainingKeyValues);
};
var get = function (map, key) {
    if (map.type === 'nil') {
        return {
            type: 'nil',
        };
    }
    var keyAndValue = Object.entries(map.value).find(function (_a) {
        var k = _a[0];
        return k === key.value;
    });
    return keyAndValue
        ? keyAndValue[1]
        : {
            type: "nil"
        };
};
var contains = function (map, key) {
    return toBool(Object.keys(map.value).includes(key.value));
};
var keys = function (map) { return ({
    type: "list",
    value: Object.keys(map.value).map(function (key) { return ({
        type: key.startsWith("\u029E") ? "keyword" : "string",
        value: key
    }); })
}); };
var vals = function (map) { return ({
    type: "list",
    value: Object.values(map.value)
}); };
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
    "pr-str": {
        type: "function",
        value: {
            fn: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return ({
                    type: "string",
                    value: args.map(function (arg) { return printer_1.pr_str(arg, true); }).join(" ")
                });
            }
        }
    },
    println: {
        type: "function",
        value: {
            fn: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                console.log(args.map(function (arg) { return printer_1.pr_str(arg, false); }).join(" "));
                return {
                    type: "nil"
                };
            }
        }
    },
    "read-string": {
        type: "function",
        value: { fn: function (a) { return reader_1.read_str(a.value, true); } }
    },
    slurp: {
        type: "function",
        value: {
            fn: function (filename) {
                try {
                    var content = fs_1.default.readFileSync(filename.value);
                    return {
                        type: "string",
                        value: content.toString()
                    };
                }
                catch (err) {
                    throw new Error("File " + filename.value + " not found");
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
    deref: {
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
    cons: {
        type: "function",
        value: { fn: cons }
    },
    concat: {
        type: "function",
        value: { fn: concat }
    },
    nth: {
        type: "function",
        value: { fn: nth }
    },
    first: {
        type: "function",
        value: { fn: first }
    },
    rest: {
        type: "function",
        value: { fn: rest }
    },
    apply: {
        type: "function",
        value: { fn: apply }
    },
    map: {
        type: "function",
        value: { fn: map }
    },
    "nil?": {
        type: "function",
        value: { fn: is_nil }
    },
    "true?": {
        type: "function",
        value: { fn: is_true }
    },
    "false?": {
        type: "function",
        value: { fn: is_false }
    },
    "symbol?": {
        type: "function",
        value: { fn: is_symbol }
    },
    throw: {
        type: "function",
        value: {
            fn: function (ast) {
                throw ast;
            }
        }
    },
    symbol: {
        type: "function",
        value: {
            fn: symbol
        }
    },
    keyword: {
        type: "function",
        value: {
            fn: keyword
        }
    },
    "keyword?": {
        type: "function",
        value: {
            fn: is_keyword
        }
    },
    vector: {
        type: "function",
        value: {
            fn: vector
        }
    },
    "vector?": {
        type: "function",
        value: {
            fn: is_vector
        }
    },
    "sequential?": {
        type: "function",
        value: {
            fn: function (a) { return toBool(isSeq(a)); }
        }
    },
    "hash-map": {
        type: "function",
        value: {
            fn: hashmap
        }
    },
    "map?": {
        type: "function",
        value: {
            fn: is_map
        }
    },
    assoc: {
        type: "function",
        value: {
            fn: assoc
        }
    },
    dissoc: {
        type: "function",
        value: {
            fn: dissoc
        }
    },
    get: {
        type: "function",
        value: {
            fn: get
        }
    },
    "contains?": {
        type: "function",
        value: {
            fn: contains
        }
    },
    keys: {
        type: "function",
        value: {
            fn: keys
        }
    },
    vals: {
        type: "function",
        value: {
            fn: vals
        }
    }
};
