import { Data } from "./types";

export class Env {
  outer: Env | null;
  data: { [K: string]: Data };
  constructor(outer: Env | null = null) {
    this.outer = outer;
    this.data = {};
  }

  set(key: string, value: Data) {
    this.data[key] = value;
  }

  find(key: string): Env {
    if (this.data[key] !== undefined) {
      return this;
    }
    if (this.outer !== null) {
      return this.outer.find(key);
    }
    throw new Error("not found : " + key);
  }

  get(key: string) {
    return this.find(key).data[key];
  }
}

