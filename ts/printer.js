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
    if (data.type === "string") {
        if (print_readability) {
            return "\"" + data.value + "\"";
        }
        return data.value.replace(/\\n/g, "\n");
    }
    if (data.type === "number") {
        return data.value.toString();
    }
    if (data.type === "symbol" || data.type === "error") {
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
    if (data.type === "list") {
        return "(" + data.value
            .map(function (val) { return exports.pr_str(val, print_readability); })
            .join(" ") + ")";
    }
    return "";
};
