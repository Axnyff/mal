type Env = {
  [K: string]: Data;
}

type Primitive = Sym | Num;

type Data = Primitive | List | Fun;

type Fun = {
  type: "function"
  value: Function;
}

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

