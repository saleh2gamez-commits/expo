import type { LogBoxLogData, LogBoxLogDataLegacy } from './Types';
import { parseInterpolation } from './parseLogBoxLog';
import { parseErrorStack } from '../utils/devServerEndpoints';

type MetroFormattedError = {
  description: string;
  filename?: string;
  lineNumber?: number;
};

const METRO_ERROR_FORMAT =
  /^(?:InternalError Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/u;

export class MetroBuildError extends Error {
  public ansiError: string;

  constructor(
    message: string,
    public errorType?: string,
    public errors?: MetroFormattedError[]
  ) {
    super(message);
    this.ansiError = message;
    // Strip the ansi so it shows as a normalized error in the console log.
    this.message = stripAnsi(message);
  }

  toLogBoxLogData(): LogBoxLogData {
    // TODO: Split into different error
    const metroInternalError = this.ansiError.match(METRO_ERROR_FORMAT);
    if (metroInternalError) {
      const [content, fileName, row, column, codeFrame] = metroInternalError.slice(1);

      return {
        level: 'fatal',
        type: 'Metro Error',
        stack: [],
        isComponentError: false,
        componentStack: [],
        codeFrame: {
          stack: {
            fileName,
            location: {
              row: parseInt(row, 10),
              column: parseInt(column, 10),
            },
            content: codeFrame,
          },
        },
        message: {
          content,
          substitutions: [],
        },
        category: `${fileName}-${row}-${column}`,
      };
    }

    const babelCodeFrameError = this.ansiError.match(BABEL_CODE_FRAME_ERROR_FORMAT);

    if (babelCodeFrameError) {
      // Codeframe errors are thrown from any use of buildCodeFrameError.
      const [fileName, content, codeFrame] = babelCodeFrameError.slice(1);
      return {
        level: 'syntax',
        stack: [],
        isComponentError: false,
        componentStack: [],
        codeFrame: {
          stack: {
            fileName,
            location: null, // We are not given the location.
            content: codeFrame,
          },
        },
        message: {
          content,
          substitutions: [],
        },
        category: `${fileName}-${1}-${1}`,
      };
    }

    return {
      level: 'fatal',
      stack: parseErrorStack(this.stack),
      codeFrame: {},
      isComponentError: false,
      componentStack: [],
      ...parseInterpolation([this.ansiError]),
    };
  }
}

const BABEL_TRANSFORM_ERROR_FORMAT =
  /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;

const BABEL_CODE_FRAME_ERROR_FORMAT =
  /^(?:TransformError )?(?:.*):? (?:.*?)([/|\\].*): ([\s\S]+?)\n((?:[ >]*\d+[\s|]+[^\n]*\n?)+|\u{001b}\[[0-9;]*m(?:.*\n?)+?(?=\n\n|\n[^\u{001b}\s]|$))/mu;

export class MetroTransformError extends MetroBuildError {
  public codeFrame: string | undefined;
  constructor(
    message: string,
    public errorType: string,
    public errors: MetroFormattedError[],
    public lineNumber: number,
    public column: number,
    public filename: string
  ) {
    super(message);

    // TODO: Remove need for regex by passing code frame in error data from Metro.
    const babelTransformError = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
    if (babelTransformError) {
      // Transform errors are thrown from inside the Babel transformer.
      const [content, codeFrame] = babelTransformError.slice(1);
      this.codeFrame = codeFrame;
      this.message = stripAnsi(content);
    }
  }

  toLogBoxLogData(): LogBoxLogData {
    // MetroTransformError is a custom error type that we throw when the transformer fails.
    // It has a stack trace and a message.
    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        stack: this.codeFrame
          ? {
              fileName: this.filename,
              location: {
                row: this.lineNumber,
                column: this.column,
              },
              content: this.codeFrame,
            }
          : undefined,
      },
      message: {
        content: this.message,
        substitutions: [],
      },
      category: `${this.filename}-${this.lineNumber}-${this.column}`,
    };
  }
}

export class MetroPackageResolutionError extends MetroBuildError {
  constructor(
    message: string,
    public errorType: string | undefined,
    public errors: MetroFormattedError[] | undefined,
    /** "/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx" */
    public originModulePath: string,
    /** "foobar" */

    public targetModuleName: string,
    public cause: // node module
    | {
          /** ["/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/node_modules",] */
          dirPaths: string[];
          /** [] */
          extraPaths: string[];
        }
      // file
      | {
          candidates: {
            file: {
              type: 'sourceFile';
              /** "__e2e__/05-errors/app/foobar" */
              filePathPrefix: string;
              /** ["",".web.ts",".ts"] */
              candidateExts: string[];
            };
            dir: {
              type: 'sourceFile';
              filePathPrefix: string;
              candidateExts: string[];
            };
          };
          name: 'Error';
          message: string;
          stack: string;
        }
  ) {
    super(message);
  }

  toLogBoxLogData(): LogBoxLogData {
    const babelCodeFrameError = this.ansiError.match(BABEL_CODE_FRAME_ERROR_FORMAT);
    const dirPaths = (this.cause as { dirPaths: string[] } | undefined)?.dirPaths;

    return {
      level: 'resolution',
      // TODO: Add import stacks
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        stack: babelCodeFrameError?.[3]
          ? {
              fileName: this.originModulePath,
              location: null, // We are not given the location.
              content: babelCodeFrameError?.[3],
            }
          : undefined,
      },
      message: {
        content: `Unable to resolve module ${this.targetModuleName}`,
        substitutions: [],
      },
      // TODO: This doesn't work for initial bundling resolution errors (only for HMR)
      isMissingModuleError: dirPaths ? this.targetModuleName : undefined,
      category: `${this.originModulePath}-${1}-${1}`,
    };
  }

  toLogBoxLogDataLegacy(): LogBoxLogDataLegacy {
    const logBoxLogData = this.toLogBoxLogData();
    return {
      ...logBoxLogData,
      componentStack: [],
      codeFrame: logBoxLogData.codeFrame?.stack || undefined,
    };
  }
}

function stripAnsi(str: string) {
  if (!str) {
    return str;
  }
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  return str.replace(new RegExp(pattern, 'g'), '');
}
