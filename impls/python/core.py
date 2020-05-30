#!/usr/bin/python3
# -*- coding: utf-8 -*-
from reader import Val, read_str
from printer import pr_str

def list_fn(*args):
    return Val("list", list(args))

def vector(*args):
    return Val("vector", list(args))

def equal_fn(a, b):
    if a.type in ("vector", "list") and b.type in ("vector", "list"):
        if len(a.value) != len(b.value):
            return False
        for i, v in enumerate(a.value):
            if not equal_fn(v, b.value[i]):
                return False
        return True
    if a.type != b.type:
        return False

    if a.type == "hashmap":
        if len(a.value) !=  len(b.value):
            return False
        for key in a.value:
            if not equal_fn(a.value[key], b.value[key]):
                return False
        return True

    return a.value == b.value

    return Val("list", list(args))

def pr_str_fn(*args):
    return Val("string", " ".join(map(lambda a:pr_str(a, True), list(args))))

def str_fn(*args):
    return Val("string", "".join(map(lambda a:pr_str(a, False), list(args))))

def println_fn(*args):
    print(" ".join(map(lambda a:pr_str(a, False), list(args))))
    return Val("nil", [])

def prn(*args):
    print(" ".join(map(lambda a:pr_str(a, True), list(args))))
    return Val("nil", [])

def slurp(arg):
    content = ""
    with open(arg.value, "r") as f:
        content = f.read()
    return Val("string", content)

def reset(a, b):
    a.value = b
    return b

def swap(atom, func, *args):
    arguments = [atom.value] +  list(args)
    if func.type == "custom_fn":
        atom.value = func.value["fn"](*arguments)
    else: 
        atom.value = func.value(*arguments)
    return atom.value

def concat(*arg):
    result = []
    for l in list(arg):
        result += l.value
    return Val("list", result)

def throw(arg):
    raise Exception(arg)

def apply(fn, *extra):
    all_args = list(extra)
    args = all_args[0:-1] + all_args[len(all_args) -1].value
    if fn.type == 'fn':
        return fn.value(*args)
    return fn.value["fn"](*args)

def map_fn(fn, col):
    res = []
    for i in col.value:
        if fn.type == 'fn':
            res.append(*fn.value(i))
        else:
            res.append(fn.value["fn"](i))
    return Val("list", res)

def hashmap(*args):
    arg_list = list(args)
    i = 0
    res = {}
    while i < len(arg_list):
        res[args[i].value] = args[i + 1]
        i += 2
    return Val("hashmap", res)

def dissoc(d, *args):
    keys_to_remove = map(lambda a: a.value, args)
    res = {}
    for key in d.value:
        if key not in keys_to_remove:
            res[key] = d.value[key]
    return Val("hashmap", res)

def assoc(d, *args):
    res = {}
    for key in d.value:
        res[key] = d.value[key]
    arg_list = list(args)
    i = 0
    while i < len(arg_list):
        res[arg_list[i].value] = arg_list[i + 1]
        i += 2
    return Val("hashmap", res)

raw_ns = {
    "+": lambda a,b : Val("number", a.value + b.value),
    "-": lambda a,b : Val("number", a.value - b.value),
    "*": lambda a,b : Val("number", a.value * b.value),
    "/": lambda a,b : Val("number", a.value / b.value),
    "<": lambda a,b : Val("bool", a.value < b.value),
    "<=": lambda a,b : Val("bool", a.value <= b.value),
    ">=": lambda a,b : Val("bool", a.value >= b.value),
    ">": lambda a,b : Val("bool", a.value > b.value),
    "list": list_fn,
    "list?": lambda a: Val("bool", a.type == 'list'),
    "empty?": lambda a: Val("bool", len(a.value) == 0),
    "count": lambda a: Val("number", len(a.value)),
    "=": lambda a, b: Val("bool", equal_fn(a, b)),
    "pr-str": pr_str_fn,
    "str": str_fn,
    "println": println_fn,
    "prn": prn,
    "read-string": lambda a: read_str(a.value),
    "slurp": slurp,
    "atom": lambda a: Val("atom", a),
    "atom?": lambda a: Val("bool", a.type == "atom"),
    "deref": lambda a: a.value,
    "reset!": reset,
    "swap!": swap,
    "cons": lambda a,b: Val("list", [a] + b.value),
    "concat": concat,
    "first": lambda a: Val("nil", []) if len(a.value) == 0 else a.value[0],
    "rest": lambda a: Val("list", a.value[1:]),
    "nth": lambda a, b: a.value[b.value],
    "throw": throw,
    "apply": apply,
    "keyword?": lambda a: Val("bool", a.type == 'keyword'),
    "nil?": lambda a: Val("bool", a.type == 'nil'),
    "false?": lambda a: Val("bool", a.type == 'bool' and a.value == False),
    "true?": lambda a: Val("bool", a.type == 'bool' and a.value == True),
    "symbol?": lambda a: Val("bool", a.type == 'symbol'),
    "symbol": lambda a: Val("symbol", a.value),
    "keyword": lambda a: a if a.type == "keyword" else Val("keyword", ":" + a.value),
    "vector": vector,
    "vector?": lambda a: Val("bool", a.type == "vector"),
    "keys": lambda a: Val("list", map(lambda b: Val("keyword", b) if b[0:2] == "ʞ" else Val("string", b), a.value.keys())),
    "vals": lambda a: Val("list", a.value.values()),
    "hash-map": hashmap,
    "dissoc": dissoc,
    "assoc": assoc,
    "contains?": lambda a, b: Val("bool", b.value in a.value),
    "get": lambda a, b: Val("nil", []) if b.value not in a.value else a.value[b.value],
    "map?": lambda a: Val("bool", a.type == "hashmap"),
    "map": map_fn,
    "sequential?": lambda a: Val("bool", a.type in ('vector', 'list')),
}

ns = {}
for key in raw_ns:
    ns[key] = Val("fn", raw_ns[key])
