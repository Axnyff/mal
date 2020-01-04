import { List, Vector, Primitive, Data } from './types';

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
  switch (token[0]) {
    case "(":
      return read_list(reader);

    case "[":
      return read_vector(reader);

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
  if (token[0] == '"') {
    if (token[token.length - 1] !== "") {
      return {
        type: "error",
        value: ".*(EOF|end of input|unbalanced).*"
      };
    }
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
