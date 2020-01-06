import fs from "fs";
import {
  Data,
  Fun,
  Bool,
  Str,
  Err,
  Num,
  Seq,
  List,
  Vector,
  Atom
} from "./types";
import { pr_str } from "./printer";
import { read_str } from "./reader";

const prn = (arg: Data): Data => {
  console.log(pr_str(arg, true));
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

const is_list = (arg: Data): Bool => {
  return {
    type: "bool",
    value: arg.type === "list"
  };
};

const is_empty = (arg: Data): Bool => {
  return {
    type: "bool",
    value: count(arg).value === 0
  };
};

const count = (arg: Data): Num | Err => {
  if (arg.type === "nil") {
    return {
      type: "number",
      value: 0
    };
  }
  if (arg.type !== "list" && arg.type !== "vector") {
    return {
      type: "error",
      value: "empty? should be called on a list"
    };
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

const equal = (a: Data, b: Data): Bool => {
  return {
    type: "bool",
    value: _equal(a, b)
  };
};

const buildCompFn = (fn: (a: number, b: number) => boolean) => (
  arg1: Data,
  arg2: Data
): Bool | Err => {
  if (arg1.type !== "number" || arg2.type !== "number") {
    return {
      type: "error",
      value: "numeric function called with non numbers"
    };
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
    value: { fn: (a: Str) => read_str(a.value) }
  },
  slurp: {
    type: "function",
    value: {
      fn: (filename: Str) => {
        try {
          const content = fs.readFileSync(filename.value);
          return {
            type: "string",
            value: content.toString().replace(/\n/g, "\\n")
          };
        } catch (err) {
          return {
            type: "error",
            value: `File ${filename.value} not found`
          };
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
  }
};
