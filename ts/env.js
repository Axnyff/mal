"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Env = /** @class */ (function () {
    function Env(outer) {
        if (outer === void 0) { outer = null; }
        this.outer = outer;
        this.data = {};
    }
    Env.prototype.set = function (key, value) {
        this.data[key] = value;
    };
    Env.prototype.find = function (key) {
        if (this.data[key] !== undefined) {
            return this;
        }
        if (this.outer !== null) {
            return this.outer.find(key);
        }
        throw new Error("not found : " + key);
    };
    Env.prototype.get = function (key) {
        return this.find(key).data[key];
    };
    return Env;
}());
exports.Env = Env;
