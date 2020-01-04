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

  if (data.type === "string") {
    if (print_readability) {
      return `"${data.value}"`;
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

  if (data.type === "list") {
    return `(${data.value
      .map(val => pr_str(val, print_readability))
      .join(" ")})`;
  }
  return "";
};
