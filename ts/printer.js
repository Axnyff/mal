"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pr_str = function (data) {
    if (data.type === "number") {
        return data.value.toString();
    }
    if (data.type === "symbol") {
        return data.value;
    }
    if (data.type === "list") {
        return "(" + data.value.map(exports.pr_str).join(" ") + ")";
    }
    return "";
};
