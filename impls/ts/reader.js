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
var read_form = function (reader, expand) {
    var token = reader.peek();
    if (!token) {
        return {
            type: "nil"
        };
    }
    while (token.startsWith(";")) {
        reader.next();
        token = reader.peek();
        if (!token) {
            return {
                type: "nil"
            };
        }
    }
    switch (token) {
        case "@":
            if (expand) {
                reader.next();
                return {
                    type: "list",
                    value: [
                        {
                            type: "symbol",
                            value: "deref"
                        },
                        read_form(reader, expand)
                    ]
                };
            }
        case "'":
            if (expand) {
                reader.next();
                return {
                    type: "list",
                    value: [
                        {
                            type: "symbol",
                            value: "quote"
                        },
                        read_form(reader, expand)
                    ]
                };
            }
        case "`":
            if (expand) {
                reader.next();
                return {
                    type: "list",
                    value: [
                        {
                            type: "symbol",
                            value: "quasiquote"
                        },
                        read_form(reader, expand)
                    ]
                };
            }
        case "^":
            if (expand) {
                reader.next();
                var meta = read_form(reader, expand);
                var content = read_form(reader, expand);
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
            }
        case "~":
            if (expand) {
                reader.next();
                return {
                    type: "list",
                    value: [
                        {
                            type: "symbol",
                            value: "unquote"
                        },
                        read_form(reader, expand)
                    ]
                };
            }
        case "~@":
            if (expand) {
                reader.next();
                return {
                    type: "list",
                    value: [
                        {
                            type: "symbol",
                            value: "splice-unquote"
                        },
                        read_form(reader, expand)
                    ]
                };
            }
        case "(":
            return read_list(reader, expand);
        case "[":
            return read_vector(reader, expand);
        case "{":
            return read_map(reader, expand);
        default:
            return read_atom(reader);
    }
};
var read_list = function (reader, expand) {
    var list_content = [];
    reader.next();
    while (reader.peek()[0] !== ")") {
        var form = read_form(reader, expand);
        list_content.push(form);
    }
    reader.next();
    return {
        type: "list",
        value: list_content
    };
};
var read_vector = function (reader, expand) {
    var vector_content = [];
    reader.next();
    while (reader.peek()[0] !== "]") {
        var form = read_form(reader, expand);
        vector_content.push(form);
    }
    reader.next();
    return {
        type: "vector",
        value: vector_content
    };
};
var read_map = function (reader, expand) {
    var map_content = {};
    reader.next();
    while (reader.peek()[0] !== "}") {
        var key = read_form(reader, expand);
        if (key.type !== "string" && key.type !== "keyword") {
            throw new Error(".*(Wrong key for map).*");
        }
        var value = read_form(reader, expand);
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
            throw new Error(".*(EOF|end of input|unbalanced).*");
        }
        var value = token.slice(1, -1).replace(/\\([\\n"])/g, function (match) {
            if (match === "\\\\") {
                return "\\";
            }
            if (match === '\\"') {
                return '"';
            }
            return "\n";
        });
        return {
            type: "string",
            value: value
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
exports.read_str = function (input, expand) {
    if (expand === void 0) { expand = false; }
    var tokens = tokenize(input);
    var reader = new Reader(tokens);
    try {
        return read_form(reader, expand);
    }
    catch (e) {
        throw new Error(".*(EOF|end of input|unbalanced).*");
    }
};
