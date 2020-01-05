import { Data } from "./types";
export const pr_str = (
  data: Data,
  print_readability: boolean = true
): string => {
  if (!data) {
    return "";
  }
  if (data.type === "atom") {
    return `(atom ${pr_str(data.value, print_readability)})`;
  }
  if (data.type === "keyword") {
    return data.value.slice(1);
  }

  if (data.type === "string") {
    if (print_readability) {
      return `"${data.value.replace(/"/g, '\\"')}"`;
    }
    return data.value.replace(/\\n/g, "\n");
  }

  if (data.type === "number") {
    return data.value.toString();
  }

  if (data.type === "symbol" || data.type === "error") {
    return data.value;
  }

  if (data.type === "nil") {
    return "nil";
  }

  if (data.type === "function") {
    return "#<function>";
  }

  if (data.type === "bool") {
    return data.value.toString();
  }

  if (data.type === "map") {
    const content = Object.entries(data.value).reduce((acc, [key, value], i, src) => {
      const printedKey = key.startsWith("ʞ") ? 
        key.slice(1) : `"${key}"`;
      acc += printedKey;
      acc += " ";
      acc += pr_str(value, print_readability);
      if (i < src.length - 1) {
        acc += ' ';
      }
      return acc;
    }, "");
    return `{${content}}`;
  }

  if (data.type === "list") {
    return `(${data.value
      .map(val => pr_str(val, print_readability))
      .join(" ")})`;
  }

  if (data.type === "vector") {
    return `[${data.value
      .map(val => pr_str(val, print_readability))
      .join(" ")}]`;
  }
  return "";
};
