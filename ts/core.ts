import fs from "fs";
import {
  Data,
  Keyword,
  Sym,
  Fun,
  Bool,
  Str,
  Err,
  Num,
  Seq,
  List,
  HashMap,
  Atom,
  Nil
} from "./types";
import { pr_str } from "./printer";
import { read_str } from "./reader";

const prn = (...args: Data[]): Data => {
  console.log(args.map(arg => pr_str(arg, true)).join(" "));
  return {
    type: "nil"
  };
};

const list = (...args: Data[]): Data => {
  return {
    type: "list",
    value: args
  };
};

const toBool = (v: boolean): Bool => ({
  type: "bool",
  value: v
});

const is_list = (arg: Data): Bool => toBool(arg.type === "list");

const is_empty = (arg: Data): Bool => toBool(count(arg).value === 0);

const count = (arg: Data): Num | Err => {
  if (arg.type === "nil") {
    return {
      type: "number",
      value: 0
    };
  }
  if (arg.type !== "list" && arg.type !== "vector") {
    throw new Error("count? should be called on a list");
  }
  return {
    type: "number",
    value: arg.value.length
  };
};

const isSeq = (a: Data): a is Seq => {
  return a.type === "list" || a.type === "vector";
};

const _equal = (a: Data, b: Data): boolean => {
  if (isSeq(a) && isSeq(b)) {
    if (a.value.length !== b.value.length) {
      return false;
    }
    for (let i = 0; i < a.value.length; i++) {
      if (!_equal(a.value[i], b.value[i])) {
        return false;
      }
    }
    return true;
  }
  if (a.type !== b.type) {
    return false;
  }

  if (a.type === "map" && b.type === "map") {
    const keysA = Object.keys(a.value);
    const keysB = Object.keys(b.value);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (let key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      if (!_equal(a.value[key], b.value[key])) {
        return false;
      }
    }
    return true;
  }

  return a.value === b.value;
};

const equal = (a: Data, b: Data): Bool => toBool(_equal(a, b));

const buildCompFn = (fn: (a: number, b: number) => boolean) => (
  arg1: Data,
  arg2: Data
): Bool | Err => {
  if (arg1.type !== "number" || arg2.type !== "number") {
    throw new Error("numeric function called with non numbers");
  }
  return {
    type: "bool",
    value: fn(arg1.value, arg2.value)
  };
};

const less = buildCompFn((a, b) => a < b);
const less_or_equal = buildCompFn((a, b) => a <= b);
const more = buildCompFn((a, b) => a > b);
const more_or_equal = buildCompFn((a, b) => a >= b);

const atom = (value: Data): Atom => ({
  type: "atom",
  value
});

const is_atom = (value: Data): Bool => ({
  type: "bool",
  value: value.type === "atom"
});

const deref = (atom: Atom): Data => atom.value;

const do_reset = (atom: Atom, value: Data): Data => {
  atom.value = value;
  return value;
};

const do_swap = (atom: Atom, func: Fun, ...args: Data[]): Data => {
  atom.value = func.value.fn(...[atom.value, ...args]);
  return atom.value;
};

const cons = (ast: Data, list: List): Data => ({
  type: "list",
  value: [ast, ...list.value]
});

const concat = (...args: List[]): List => ({
  type: "list",
  value: args.reduce((acc, { value }) => acc.concat(value), [] as Data[])
});

const nth = (lst: Seq, index: Num): Data => {
  if (index.value >= lst.value.length) {
    throw new Error(".*Invalid range.*");
  }
  return lst.value[index.value];
};

const first = (lst: Seq | Nil): Data => {
  if (lst.type === "nil" || lst.value.length === 0) {
    return {
      type: "nil"
    };
  }
  return lst.value[0];
};

const rest = (lst: Seq | Nil): List => {
  if (lst.type === "nil" || lst.value.length === 0) {
    return {
      type: "list",
      value: []
    };
  }
  return { type: "list", value: lst.value.slice(1) };
};

const apply = (f: Fun, ...args: Data[]) => {
  const lastArg = args[args.length - 1];
  if (!isSeq(lastArg)) {
    throw new Error("");
  }
  const actualArgs = [...args.slice(0, -1), ...lastArg.value];
  return f.value.fn(...actualArgs);
};

const map = (f: Fun, col: Seq): List => {
  return {
    type: "list",
    value: col.value.map(f.value.fn)
  };
};

const is_nil = (ast: Data) => toBool(ast.type === "nil");

const is_true = (ast: Data) => toBool(ast.value === true);

const is_false = (ast: Data) => toBool(ast.value === false);

const is_symbol = (ast: Data) => toBool(ast.type === "symbol");

const symbol = (ast: Str): Sym => ({
  type: "symbol",
  value: ast.value
});

const keyword = (ast: Str | Keyword): Keyword =>
  ast.type === "keyword"
    ? ast
    : {
        type: "keyword",
        value: `\u029E:${ast.value}`
      };

const is_keyword = (ast: Data) => toBool(ast.type === "keyword");

const vector = (...args: Data[]): Data => ({
  type: "vector",
  value: args
});

const is_vector = (ast: Data) => toBool(ast.type === "vector");

const hashmap = (...args: Data[]): HashMap => {
  const content: HashMap["value"] = {};
  let i = 0;
  while (i < args.length) {
    let key = args[i];
    let value = args[i + 1];
    if (key.type !== "string" && key.type !== "keyword") {
      throw new Error("wrong key for map");
    }
    content[key.value] = value;
    i += 2;
  }
  return {
    type: "map",
    value: content
  };
};

const is_map = (arg: Data) => toBool(arg.type === "map");

const assoc = (map: HashMap, ...keyValues: Data[]): HashMap => {
  const existingKeyValues: Data[] = Object.entries(map.value).reduce(
    (acc, [key, value]) => {
      return [
        ...acc,
        {
          type: key.startsWith("\u029E") ? "keyword" : "string",
          value: key
        },
        value
      ];
    },
    [] as Data[]
  );
  return hashmap(...existingKeyValues, ...keyValues);
};

const dissoc = (map: HashMap, ...keyToRemove: Data[]): HashMap => {
  const remainingKeyValues: Data[] = Object.entries(map.value).reduce(
    (acc, [key, value]) => {
      if (keyToRemove.some(({ value }) => value === key)) {
        return acc;
      }
      return [
        ...acc,
        {
          type: key.startsWith("\u029E") ? "keyword" : "string",
          value: key
        },
        value
      ];
    },
    [] as Data[]
  );
  return hashmap(...remainingKeyValues);
};

const get = (map: HashMap | Nil, key: Str | Keyword): Data => {
  if (map.type === 'nil') {
    return {
      type: 'nil',
    }
  }
  const keyAndValue = Object.entries(map.value).find(([k]) => k === key.value);
  return keyAndValue
    ? keyAndValue[1]
    : {
        type: "nil"
      };
};

const contains = (map: HashMap, key: Str | Keyword): Data =>
  toBool(Object.keys(map.value).includes(key.value));

const keys = (map: HashMap): List => ({
  type: "list",
  value: Object.keys(map.value).map(key => ({
    type: key.startsWith("\u029E") ? "keyword" : "string",
    value: key
  }))
});

const vals = (map: HashMap): List => ({
  type: "list",
  value: Object.values(map.value)
});

export const ns: { [K: string]: Fun } = {
  prn: {
    type: "function",
    value: { fn: prn }
  },
  list: {
    type: "function",
    value: { fn: list }
  },
  "list?": {
    type: "function",
    value: { fn: is_list }
  },
  "empty?": {
    type: "function",
    value: { fn: is_empty }
  },
  count: {
    type: "function",
    value: { fn: count }
  },
  "<": {
    type: "function",
    value: { fn: less }
  },
  "<=": {
    type: "function",
    value: { fn: less_or_equal }
  },
  ">": {
    type: "function",
    value: { fn: more }
  },
  ">=": {
    type: "function",
    value: { fn: more_or_equal }
  },
  "=": {
    type: "function",
    value: { fn: equal }
  },
  str: {
    type: "function",
    value: {
      fn: (...args: Data[]) => ({
        type: "string",
        value: args.map(arg => pr_str(arg, false)).join("")
      })
    }
  },
  "pr-str": {
    type: "function",
    value: {
      fn: (...args: Data[]) => ({
        type: "string",
        value: args.map(arg => pr_str(arg, true)).join(" ")
      })
    }
  },
  println: {
    type: "function",
    value: {
      fn: (...args: Data[]) => {
        console.log(args.map(arg => pr_str(arg, false)).join(" "));
        return {
          type: "nil"
        };
      }
    }
  },
  "read-string": {
    type: "function",
    value: { fn: (a: Str) => read_str(a.value, true) }
  },
  slurp: {
    type: "function",
    value: {
      fn: (filename: Str) => {
        try {
          const content = fs.readFileSync(filename.value);
          return {
            type: "string",
            value: content.toString()
          };
        } catch (err) {
          throw new Error(`File ${filename.value} not found`);
        }
      }
    }
  },
  atom: {
    type: "function",
    value: { fn: atom }
  },
  "atom?": {
    type: "function",
    value: { fn: is_atom }
  },
  deref: {
    type: "function",
    value: { fn: deref }
  },
  "reset!": {
    type: "function",
    value: { fn: do_reset }
  },
  "swap!": {
    type: "function",
    value: { fn: do_swap }
  },
  cons: {
    type: "function",
    value: { fn: cons }
  },
  concat: {
    type: "function",
    value: { fn: concat }
  },
  nth: {
    type: "function",
    value: { fn: nth }
  },
  first: {
    type: "function",
    value: { fn: first }
  },
  rest: {
    type: "function",
    value: { fn: rest }
  },
  apply: {
    type: "function",
    value: { fn: apply }
  },
  map: {
    type: "function",
    value: { fn: map }
  },
  "nil?": {
    type: "function",
    value: { fn: is_nil }
  },
  "true?": {
    type: "function",
    value: { fn: is_true }
  },
  "false?": {
    type: "function",
    value: { fn: is_false }
  },
  "symbol?": {
    type: "function",
    value: { fn: is_symbol }
  },
  throw: {
    type: "function",
    value: {
      fn: (ast: Data) => {
        throw ast;
      }
    }
  },
  symbol: {
    type: "function",
    value: {
      fn: symbol
    }
  },
  keyword: {
    type: "function",
    value: {
      fn: keyword
    }
  },
  "keyword?": {
    type: "function",
    value: {
      fn: is_keyword
    }
  },
  vector: {
    type: "function",
    value: {
      fn: vector
    }
  },
  "vector?": {
    type: "function",
    value: {
      fn: is_vector
    }
  },
  "sequential?": {
    type: "function",
    value: {
      fn: a => toBool(isSeq(a))
    }
  },
  "hash-map": {
    type: "function",
    value: {
      fn: hashmap
    }
  },
  "map?": {
    type: "function",
    value: {
      fn: is_map
    }
  },
  assoc: {
    type: "function",
    value: {
      fn: assoc
    }
  },
  dissoc: {
    type: "function",
    value: {
      fn: dissoc
    }
  },
  get: {
    type: "function",
    value: {
      fn: get
    }
  },
  "contains?": {
    type: "function",
    value: {
      fn: contains
    }
  },
  keys: {
    type: "function",
    value: {
      fn: keys
    }
  },
  vals: {
    type: "function",
    value: {
      fn: vals
    }
  }
};
