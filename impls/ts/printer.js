"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pr_str = function (data, print_readability) {
    if (print_readability === void 0) { print_readability = true; }
    if (!data) {
        return "";
    }
    if (data.type === "atom") {
        return "(atom " + exports.pr_str(data.value, print_readability) + ")";
    }
    if (data.type === "keyword") {
        return data.value.slice(1);
    }
    if (data.type === "string") {
        if (print_readability) {
            var str = data.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
            return "\"" + str + "\"";
        }
        return data.value;
    }
    if (data.type === "number") {
        return data.value.toString();
    }
    if (data.type === 'error') {
        return exports.pr_str(data.value);
    }
    if (data.type === "symbol") {
        return data.value;
    }
    if (data.type === "nil") {
        return "nil";
    }
    if (data.type === "function") {
        return "#<function>";
    }
    if (data.type === "bool") {
        return data.value.toString();
    }
    if (data.type === "map") {
        var content = Object.entries(data.value).reduce(function (acc, _a, i, src) {
            var key = _a[0], value = _a[1];
            var printedKey = key.startsWith("ʞ") ?
                key.slice(1) : "\"" + key + "\"";
            acc += printedKey;
            acc += " ";
            acc += exports.pr_str(value, print_readability);
            if (i < src.length - 1) {
                acc += ' ';
            }
            return acc;
        }, "");
        return "{" + content + "}";
    }
    if (data.type === "list") {
        return "(" + data.value
            .map(function (val) { return exports.pr_str(val, print_readability); })
            .join(" ") + ")";
    }
    if (data.type === "vector") {
        return "[" + data.value
            .map(function (val) { return exports.pr_str(val, print_readability); })
            .join(" ") + "]";
    }
    return "";
};
