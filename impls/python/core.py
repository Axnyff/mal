from reader import Val, read_str
from printer import pr_str

def list_fn(*args):
    return Val("list", list(args))

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

def deref(a):
    return a.value

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
    "deref": deref,
    "reset!": reset,
    "swap!": swap,
}

ns = {}
for key in raw_ns:
    ns[key] = Val("fn", raw_ns[key])
