import chalk from 'chalk';
import util from 'util';

function stringifyParams(params: any[]) {
  const formattedArgs = params.map((item) => {
    if (item === null || item === undefined) {
      return String(item);
    }

    if (typeof item === 'string') {
      return item;
    }

    if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') {
      return String(item);
    }
    return util.inspect(item, {
      depth: null, // 显示对象的所有层级（默认只显示2层）
      colors: false, // 关闭 util.inspect 的内置颜色（避免和 chalk 冲突）
      compact: false, // 展开显示对象（更易读）
    });
  });
  return formattedArgs.join('');
}

const LoggerLevel = {
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Verbose: 'verbose',
  Debug: 'debug',
};

export class GeneralLogger {
  levels: { [propName: string]: any };
  currentLevel: number;
  constructor(levelKey = LoggerLevel.Info) {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      verbose: 3,
      debug: 4,
    };
    this.currentLevel = this.levels[levelKey] || this.levels.info;
  }

  shouldLog(levelKey: string) {
    return this.currentLevel >= this.levels[levelKey];
  }

  getLoggerPrefix(logLevel: string) {
    let prefixText = '';
    switch (logLevel) {
      case LoggerLevel.Error:
        prefixText = '[ERROR]';
        break;
      case LoggerLevel.Warn:
        prefixText = '[WARN]';
        break;
      case LoggerLevel.Info:
        prefixText = '[INFO]';
        break;
      case LoggerLevel.Verbose:
        prefixText = '[VERBOSE]';
        break;
      case LoggerLevel.Debug:
        prefixText = '[DEBUG]';
        break;
      default:
        prefixText = '[INFO]';
        break;
    }
    return prefixText;
  }

  error(...args: any[]) {
    if (this.shouldLog(LoggerLevel.Error)) {
      console.error(this.getLoggerPrefix(LoggerLevel.Error), ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog(LoggerLevel.Warn)) {
      console.warn(this.getLoggerPrefix(LoggerLevel.Warn), ...args);
    }
  }

  log(...args: any[]) {
    this.info(args);
  }

  info(...args: any[]) {
    if (this.shouldLog(LoggerLevel.Info)) {
      console.log(this.getLoggerPrefix(LoggerLevel.Info), ...args);
    }
  }

  verbose(...args: any[]) {
    if (this.shouldLog(LoggerLevel.Verbose)) {
      console.log(this.getLoggerPrefix(LoggerLevel.Verbose), ...args);
    }
  }

  debug(...args: any[]) {
    if (this.shouldLog(LoggerLevel.Debug)) {
      console.log(this.getLoggerPrefix(LoggerLevel.Debug), ...args);
    }
  }
}

export class ContextLogger extends GeneralLogger {
  contextName: string;
  constructor(contextName: string, levelKey: string = LoggerLevel.Info) {
    super(levelKey);
    this.contextName = contextName;
  }

  getLoggerPrefix(logLevel: string) {
    return `[${this.contextName} ${new Date().toLocaleTimeString()}]${super.getLoggerPrefix(logLevel)}`;
  }
}

export class ProgramLogger extends ContextLogger {
  done(...restParam: any[]) {
    this.success.apply(this, ['✓ ', ...restParam]);
  }

  success(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Info)) {
      console.log(chalk.green(this.getLoggerPrefix(LoggerLevel.Info), stringifyParams(restParam)));
    }
  }

  info(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Info)) {
      console.log(chalk.cyan(this.getLoggerPrefix(LoggerLevel.Info), stringifyParams(restParam)));
    }
  }

  error(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Error)) {
      console.log(chalk.red(this.getLoggerPrefix(LoggerLevel.Error), '✖', stringifyParams(restParam)));
    }
  }

  warn(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Warn)) {
      console.log(chalk.yellow(this.getLoggerPrefix(LoggerLevel.Warn), stringifyParams(restParam)));
    }
  }

  verbose(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Verbose)) {
      console.log(chalk.cyan(this.getLoggerPrefix(LoggerLevel.Verbose), stringifyParams(restParam)));
    }
  }

  debug(...restParam: any[]) {
    if (this.shouldLog(LoggerLevel.Debug)) {
      console.log(chalk.cyan(this.getLoggerPrefix(LoggerLevel.Debug), stringifyParams(restParam)));
    }
  }
}

export function createProgramLogger(contextName: string, programOption: ProgramOptions) {
  if (programOption.debug) {
    return new ProgramLogger(contextName, LoggerLevel.Debug);
  }
  if (programOption.verbose) {
    return new ProgramLogger(contextName, LoggerLevel.Verbose);
  }
  return new ProgramLogger(contextName, LoggerLevel.Info);
}
