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
    switch (token) {
        case "@":
            reader.next();
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "deref"
                    },
                    read_form(reader)
                ]
            };
        case "'":
            reader.next();
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "quote"
                    },
                    read_form(reader)
                ]
            };
        case "`":
            reader.next();
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "quasiquote"
                    },
                    read_form(reader)
                ]
            };
        case "^":
            reader.next();
            var meta = read_form(reader);
            var content = read_form(reader);
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "with-meta"
                    },
                    content,
                    meta
                ]
            };
        case "~":
            reader.next();
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "unquote"
                    },
                    read_form(reader)
                ]
            };
        case "~@":
            reader.next();
            return {
                type: "list",
                value: [
                    {
                        type: "symbol",
                        value: "splice-unquote"
                    },
                    read_form(reader)
                ]
            };
        case "(":
            return read_list(reader);
        case "[":
            return read_vector(reader);
        case "{":
            return read_map(reader);
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
var read_vector = function (reader) {
    var vector_content = [];
    reader.next();
    while (reader.peek()[0] !== "]") {
        var form = read_form(reader);
        vector_content.push(form);
    }
    reader.next();
    return {
        type: "vector",
        value: vector_content
    };
};
var read_map = function (reader) {
    var map_content = {};
    reader.next();
    while (reader.peek()[0] !== "}") {
        var key = read_form(reader);
        if (key.type !== "string" && key.type !== "keyword") {
            return {
                type: "error",
                value: "wrong key for maop"
            };
        }
        var value = read_form(reader);
        map_content[key.value] = value;
    }
    reader.next();
    return {
        type: "map",
        value: map_content
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
    if (token[0] == ":") {
        return {
            type: "keyword",
            value: "\u029E" + token
        };
    }
    if (token[0] == '"') {
        var valid = token.match(/^"(\\[n"\\]|[^\\"])*"$/);
        if (!valid) {
            return {
                type: "error",
                value: ".*(EOF|end of input|unbalanced).*"
            };
        }
        return {
            type: "string",
            value: token.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n"),
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
            type: "error",
            value: ".*(EOF|end of input|unbalanced).*"
        };
    }
};
