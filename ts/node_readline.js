"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var ffi = __importStar(require("ffi-napi"));
var fs = __importStar(require("fs"));
// IMPORTANT: choose one
var RL_LIB = "libreadline"; // NOTE: libreadline is GPL
// var RL_LIB = "libedit";
var HISTORY_FILE = path.join(process.env.HOME || ".", ".mal-history");
var rllib = ffi.Library(RL_LIB, {
    "readline": ["string", ["string"]],
    "add_history": ["int", ["string"]],
});
var rlHistoryLoaded = false;
function readline(prompt) {
    prompt = prompt || "user> ";
    if (!rlHistoryLoaded) {
        rlHistoryLoaded = true;
        var lines = [];
        if (fs.existsSync(HISTORY_FILE)) {
            lines = fs.readFileSync(HISTORY_FILE).toString().split("\n");
        }
        // Max of 2000 lines
        lines = lines.slice(Math.max(lines.length - 2000, 0));
        for (var i = 0; i < lines.length; i++) {
            if (lines[i]) {
                rllib.add_history(lines[i]);
            }
        }
    }
    var line = rllib.readline(prompt);
    if (line) {
        rllib.add_history(line);
        try {
            fs.appendFileSync(HISTORY_FILE, line + "\n");
        }
        catch (exc) {
            // ignored
        }
    }
    return line;
}
exports.readline = readline;
;
