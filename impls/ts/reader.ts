import { List, Vector, HashMap, Primitive, Data, Err } from "./types";

class Reader {
  position: number;
  tokens: string[];
  constructor(tokens: string[]) {
    this.tokens = tokens;
    this.position = 0;
  }
  next() {
    return this.tokens[this.position++];
  }
  peek() {
    return this.tokens[this.position];
  }
}

const tokenize = (input: string) => {
  const regex = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  const tokens = [];
  let match = regex.exec(input);
  while (match !== null && match[0] !== "") {
    tokens.push(match[1]);
    if (match.index >= input.length) {
      break;
    }
    match = regex.exec(input);
  }

  return tokens;
};

const read_form = (reader: Reader, expand: boolean): Data => {
  let token = reader.peek();
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
        const meta = read_form(reader, expand);
        const content = read_form(reader, expand);
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

const read_list = (reader: Reader, expand: boolean): List => {
  const list_content = [];
  reader.next();
  while (reader.peek()[0] !== ")") {
    const form = read_form(reader, expand);
    list_content.push(form);
  }
  reader.next();
  return {
    type: "list",
    value: list_content
  };
};

const read_vector = (reader: Reader, expand: boolean): Vector => {
  const vector_content = [];
  reader.next();
  while (reader.peek()[0] !== "]") {
    const form = read_form(reader, expand);
    vector_content.push(form);
  }
  reader.next();
  return {
    type: "vector",
    value: vector_content
  };
};

const read_map = (reader: Reader, expand: boolean): HashMap | Err => {
  const map_content: HashMap["value"] = {};
  reader.next();
  while (reader.peek()[0] !== "}") {
    const key = read_form(reader, expand);
    if (key.type !== "string" && key.type !== "keyword") {
      throw new Error(".*(Wrong key for map).*");
    }
    const value = read_form(reader, expand);
    map_content[key.value] = value;
  }
  reader.next();
  return {
    type: "map",
    value: map_content
  };
};

const read_atom = (reader: Reader): Primitive => {
  const token = reader.next();
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
      value: `\u029E${token}`
    };
  }
  if (token[0] == '"') {
    const valid = token.match(/^"(\\[n"\\]|[^\\"])*"$/);
    if (!valid) {
      throw new Error(".*(EOF|end of input|unbalanced).*");
    }

    const value = token.slice(1, -1).replace(/\\([\\n"])/g, match => {
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
      value
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

export const read_str = (input: string, expand: boolean = false): Data => {
  const tokens = tokenize(input);
  const reader = new Reader(tokens);
  try {
    return read_form(reader, expand);
  } catch (e) {
    throw new Error(".*(EOF|end of input|unbalanced).*");
  }
};
