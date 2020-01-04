"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Reader = /** @class */ (function () {
    function Reader(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }
    Reader.prototype.next = function () {
        return this.tokens[this.position++];
    };
    Reader.prototype.peek = function () {
        return this.tokens[this.position];
    };
    return Reader;
}());
var tokenize = function (input) {
    var regex = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
    var tokens = [];
    var match = regex.exec(input);
    while (match !== null && match[0] !== "") {
        tokens.push(match[1]);
        if (match.index >= input.length) {
            break;
        }
        match = regex.exec(input);
    }
    return tokens;
};
var read_form = function (reader) {
    var token = reader.peek();
    switch (token[0]) {
        case "(":
            return read_list(reader);
        default:
            return read_atom(reader);
    }
};
var read_list = function (reader) {
    var list_content = [];
    reader.next();
    while (reader.peek()[0] !== ")") {
        var form = read_form(reader);
        list_content.push(form);
    }
    reader.next();
    return {
        type: "list",
        value: list_content
    };
};
var read_atom = function (reader) {
    var token = reader.next();
    if (token === "false" || token === "true") {
        return {
            type: "bool",
            value: token === "true"
        };
    }
    if (token === "nil") {
        return {
            type: "nil"
        };
    }
    if (token[0] == '"') {
        return {
            type: "string",
            value: token.slice(1, -1).replace(/\\"/g, '"'),
        };
    }
    if (Number.isNaN(parseFloat(token))) {
        return {
            type: "symbol",
            value: token
        };
    }
    return {
        type: "number",
        value: parseFloat(token)
    };
};
exports.read_str = function (input) {
    var tokens = tokenize(input);
    var reader = new Reader(tokens);
    try {
        return read_form(reader);
    }
    catch (e) {
        return {
            type: "symbol",
            value: ".*(EOF|end of input|unbalanced).*"
        };
    }
};
