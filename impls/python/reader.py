import re

regex = r"""[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)"""

class Reader:
    def __init__(self, tokens):
        self.tokens = tokens
        self.position = 0

    def peek(self):
        return self.tokens[self.position]

    def next(self):
        token = self.tokens[self.position]
        self.position += 1

        return token

def read_list(reader):
    reader.next()
    content = []

    while (reader.peek() != ')'):
        content.append(read_form(reader))
    reader.next()
    return {
        "type": "list",
        "value": content,
    }

def read_vector(reader):
    reader.next()
    content = []

    while (reader.peek() != ']'):
        content.append(read_form(reader))
    reader.next()
    return {
        "type": "vector",
        "value": content,
    }

def read_hashmap(reader):
    reader.next()
    content = {}

    while (reader.peek() != '}'):
        key = read_form(reader)["value"]
        content[key] = read_form(reader)
    reader.next()
    return {
        "type": "hashmap",
        "value": content,
    }

def read_atom(reader):
    token = reader.next()

    try:
        num = int(token)
        return {
            "type": "number",
            "value": num
        }
    except:
        if token[0] == '"':
            if len(token) == 1 or token[-1] != '"':
                raise "EOF"

            res = ""
            i = 1
            while i < len(token) - 1:
                if token[i] != "\\":
                    res += token[i]
                else:
                    i += 1
                    if token[i] == "\\":
                        res += "\\"
                    elif token[i] == "n":
                        res += "\n"
                    elif token[i] == '"':
                        res += '"'
                i += 1
            if token[i] != '"':
                raise "EOF"


            return {
                    "type": "string",
                    "value": res
            }
        return {
            "type": "symbol",
            "value": token
        }


def read_macro(reader, symbol):
    reader.next()
    return {
            "type": "list",
            "value": [{
                "type": "symbol",
                "value": symbol
                }, read_form(reader)
            ]
    }

def read_form(reader):
    token = reader.peek()
    if token == "(":
        return read_list(reader)
    if token == "[":
        return read_vector(reader)
    if token == "{":
        return read_hashmap(reader)
    if token == "'":
        return read_macro(reader, "quote")
    if token == "`":
        return read_macro(reader, "quasiquote")
    if token == "~":
        return read_macro(reader, "unquote")
    if token == "@":
        return read_macro(reader, "deref")
    if token == "~@":
        return read_macro(reader, "splice-unquote")
    if token == "^":
        reader.next()
        meta = read_form(reader)
        return {
                "type": "list",
                "value": [{
                    "type": "symbol",
                    "value": "with-meta",
                    },
                    read_form(reader),
                    meta]
        }
        return read_macro(reader, "splice-unquote")

    return read_atom(reader)

def read_str(s):
    try:
        tokens = re.findall(regex, s)[0:-1]
        reader = Reader(tokens)
        return read_form(reader)
    except Exception as e:
        print(e)
        return {
                "type": "error",
                "value": {
                    "type": "string",
                    "value": "EOF",
                }
        }
