"use strict";
// This is the main export for `@expo/log-box/utils` used in the `@expo/cli` and `expo/async-require/hmr`
// This needs to be transpiled to CJS for use in the Expo CLI
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebBuildErrors = exports.parseHmrBuildErrors = void 0;
var parseHmrBuildErrors_1 = require("./utils/parseHmrBuildErrors");
Object.defineProperty(exports, "parseHmrBuildErrors", { enumerable: true, get: function () { return parseHmrBuildErrors_1.parseHmrBuildErrors; } });
var parseWebBuildErrors_1 = require("./utils/parseWebBuildErrors");
Object.defineProperty(exports, "parseWebBuildErrors", { enumerable: true, get: function () { return parseWebBuildErrors_1.parseWebBuildErrors; } });
