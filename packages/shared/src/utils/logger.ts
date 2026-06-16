export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private minLevel: LogLevel;
  private prefix: string;

  constructor(prefix = 'Papyrus', minLevel: LogLevel = LogLevel.INFO) {
    this.prefix = prefix;
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < this.minLevel) return;
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const target = level >= LogLevel.ERROR ? console.error : level >= LogLevel.WARN ? console.warn : console.log;
    target(`[${timestamp}] [${levelName}] [${this.prefix}] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void { this.log(LogLevel.DEBUG, message, ...args); }
  info(message: string, ...args: unknown[]): void { this.log(LogLevel.INFO, message, ...args); }
  warn(message: string, ...args: unknown[]): void { this.log(LogLevel.WARN, message, ...args); }
  error(message: string, ...args: unknown[]): void { this.log(LogLevel.ERROR, message, ...args); }

  child(subPrefix: string): Logger {
    return new Logger(`${this.prefix}:${subPrefix}`, this.minLevel);
  }
}

export const logger = new Logger();
