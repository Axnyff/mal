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

const read_form = (reader: Reader): Data => {
  const token = reader.peek();
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
      const meta = read_form(reader);
      const content = read_form(reader);
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

const read_list = (reader: Reader): List => {
  const list_content = [];
  reader.next();
  while (reader.peek()[0] !== ")") {
    const form = read_form(reader);
    list_content.push(form);
  }
  reader.next();
  return {
    type: "list",
    value: list_content
  };
};

const read_vector = (reader: Reader): Vector => {
  const vector_content = [];
  reader.next();
  while (reader.peek()[0] !== "]") {
    const form = read_form(reader);
    vector_content.push(form);
  }
  reader.next();
  return {
    type: "vector",
    value: vector_content
  };
};

const read_map = (reader: Reader): HashMap | Err => {
  const map_content: HashMap["value"] = {};
  reader.next();
  while (reader.peek()[0] !== "}") {
    const key = read_form(reader);
    if (key.type !== "string" && key.type !== "keyword") {
      return {
        type: "error",
        value: "wrong key for maop"
      };
    }
    const value = read_form(reader);
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
    if (!valid ) {
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

export const read_str = (input: string): Data => {
  const tokens = tokenize(input);
  const reader = new Reader(tokens);
  try {
    return read_form(reader);
  } catch (e) {
    return {
      type: "error",
      value: ".*(EOF|end of input|unbalanced).*"
    };
  }
};
