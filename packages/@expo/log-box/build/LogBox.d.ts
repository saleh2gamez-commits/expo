import type { IgnorePattern, LogData } from './Data/LogBoxData';
import { type ExtendedExceptionData } from './Data/parseLogBoxLog';
export { ExtendedExceptionData, IgnorePattern, LogData };
declare const LogBox: {
    install(): void;
    uninstall(): void;
    ignoreLogs(patterns: IgnorePattern[]): void;
    ignoreAllLogs(value?: boolean): void;
    clearAllLogs(): void;
    addLog(log: LogData): void;
    addException(error: ExtendedExceptionData): void;
};
export default LogBox;
