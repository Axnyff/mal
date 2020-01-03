export const pr_str = (data: Data): string => {
  if (data.type === "number") {
    return data.value.toString();
  }
  if (data.type === "symbol") {
    return data.value;
  }

  if (data.type === "list") {
    return `(${data.value.map(pr_str).join(" ")})`;
  }
  return "";
};
