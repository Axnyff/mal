#!/usr/bin/python3
# -*- coding: utf-8 -*-
import re
from printer import pr_str

regex = r"""[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)"""


class Val:
    def __init__(self, type, value, meta = None):
        self.type = type
        self.value = value
        self.meta = meta

    def get_meta(self):
        if self.meta is None:
            return Val("nil", [])
        return self.meta

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
    return Val("list", content)

def read_vector(reader):
    reader.next()
    content = []

    while (reader.peek() != ']'):
        content.append(read_form(reader))
    reader.next()
    return Val("vector", content)

def read_hashmap(reader):
    reader.next()
    content = {}

    while (reader.peek() != '}'):
        key= read_form(reader).value
        content[key] = read_form(reader)
    reader.next()
    return Val("hashmap", content)

def read_atom(reader):
    token = reader.next()

    try:
        num = int(token)
        return Val("number", num)
    except:
        if token == "nil":
            return Val("nil", [])
        if token == "true":
            return Val("bool", True)
        if token == "false":
            return Val("bool", False)
        if token[0] == ":":
            return Val("keyword", "ʞ" + token)
        if token[0] == '"':
            if len(token) == 1 or token[-1] != '"':
                raise Exception("EOF")

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
                raise Exception("EOF")


            return Val("string", res)
        return Val("symbol", token)


def read_macro(reader, symbol):
    reader.next()
    return Val(
            "list",
            [Val("symbol", symbol),
                read_form(reader),
            ]
    )

def read_form(reader):
    token = reader.peek()
    if token[0] == ";":
        reader.next()
        return read_form(reader)

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
        return Val("list",
                [Val("symbol", "with-meta"),
                    read_form(reader),
                    meta
                ])

    return read_atom(reader)

def read_str(s):
    try:
        tokens = re.findall(regex, s)[0:-1]
        reader = Reader(tokens)
        return read_form(reader)
    except Exception as e:
        raise Exception(Val("string", "EOF"))
