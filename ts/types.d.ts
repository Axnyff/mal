import { Env } from "./env";
type Primitive = Sym | Num | Err | Bool | Nil | Str;

type Data = Primitive | List | Fun | Atom;

type Atom = {
  type: "atom";
  value: Data;
};

type Str = {
  type: "string";
  value: string;
};

type Nil = {
  type: "nil";
  value?: never;
};

type Bool = {
  type: "bool";
  value: boolean;
};

type Fun = CustomFun | RegularFun;

type CustomFun = {
  type: "function";
  value: {
    ast: List;
    params: List;
    env: Env;
    fn: (...args: any[]) => Data;
  };
};

type RegularFun = {
  type: "function";
  value: {
    params?: never;
    fn: (...args: any[]) => Data;
  };
};

type Err = {
  type: "error";
  value: string;
};

type Sym = {
  type: "symbol";
  value: string;
};

type Num = {
  type: "number";
  value: number;
};

type List = {
  type: "list";
  value: Data[];
};
