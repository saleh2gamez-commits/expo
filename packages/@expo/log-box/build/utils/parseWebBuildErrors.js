"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebBuildErrors = parseWebBuildErrors;
const BuildErrors_1 = require("../Data/BuildErrors");
/**
 * Called in expo/cli, the return value is injected into the static error page which is bundled
 * instead of the app when the web build fails.
 */
function parseWebBuildErrors({ error, projectRoot, parseErrorStack, }) {
    // NOTE: Ideally this will be merged with the parseWebHmrBuildErrors function
    // Remap direct Metro Node.js errors to a format that will appear more client-friendly in the logbox UI.
    let stack;
    if (isTransformError(error) && error.filename) {
        // Syntax errors in static rendering.
        stack = [
            {
                // Avoid using node:path to be compatible with web and RN runtime.
                file: `${projectRoot}/${error.filename}`,
                methodName: '<unknown>',
                arguments: [],
                // TODO: Import stack
                lineNumber: error.lineNumber,
                column: error.column,
            },
        ];
    }
    else if ('originModulePath' in error &&
        typeof error.originModulePath === 'string' &&
        'targetModuleName' in error &&
        typeof error.targetModuleName === 'string' &&
        'cause' in error) {
        const message = [error.type, error.message].filter(Boolean).join(' ');
        const type = error.type;
        const errors = error.errors;
        // TODO: Use import stack here when the error is resolution based.
        return new BuildErrors_1.MetroPackageResolutionError(message, type, errors, error.originModulePath, error.targetModuleName, error.cause).toLogBoxLogDataLegacy();
    }
    else {
        stack = parseErrorStack(projectRoot, error.stack);
    }
    return {
        level: 'static',
        message: {
            content: error.message,
            substitutions: [],
        },
        isComponentError: false,
        stack,
        category: 'static',
        componentStack: [],
    };
}
function isTransformError(error) {
    return error.type === 'TransformError';
}
