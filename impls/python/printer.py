def pr_str(val, print_readability = True):
    if val.type == "nil":
        return "nil"
    if val.type == "bool":
        if val.value:
            return "true"
        return "false"
    if (val.type == "number"):
        return str(val.value)
    if (val.type == "keyword"):
        return val.value
    if (val.type == "symbol"):
        return val.value
    if (val.type == "string"):
        if not print_readability:
            return val.value
        res = ""
        for i in val.value:
            if i == '"':
                res += '\\"'
            elif i == '\\':
                res += '\\\\'
            elif i == '\n':
                res += '\\n'
            else:
                res += i
        return '"' + res + '"'
    if (val.type == "list"):
        content = []
        for i in val.value:
            content.append(pr_str(i, print_readability))
        return "(" + " ".join(content) + ")"

    if (val.type == "vector"):
        content = []
        for i in val.value:
            content.append(pr_str(i, print_readability))
        return "[" + " ".join(content) + "]"

    if (val.type == "hashmap"):
        content = []
        for key, val in val.value.items():
            if key[0] == ':':
                content.append(key)
            else:
                content.append('"' + key + '"')
            content.append(pr_str(val, print_readability))
        return "{" + " ".join(content) + "}"

    if (val.type == "error"):
        return "Error: " + pr_str(val.value, print_readability)

    if (val.type == "fn" or val.type == "custom_fn"):
        return "#function"

