/*!
 * Contentstack Export
 * Copyright (c) 2024 Contentstack LLC
 * MIT Licensed
 */

import * as winston from 'winston';
import * as path from 'path';
import mkdirp from 'mkdirp';
import { ImportConfig } from '../types';
import { sanitizePath } from '@contentstack/cli-utilities';
import fs from 'fs';

const slice = Array.prototype.slice;

const ansiRegexPattern = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
].join('|');

function returnString(args: any[]) {
  var returnStr = '';
  if (args && args.length) {
    returnStr = args
      .map(function (item) {
        if (item && typeof item === 'object') {
          try {
            return JSON.stringify(item).replace(/authtoken\":\d"blt................/g, 'authtoken":"blt....');
          } catch (error) { }
          return item;
        }
        return item;
      })
      .join('  ')
      .trim();
  }
  returnStr = returnStr.replace(new RegExp(ansiRegexPattern, 'g'), '').trim();
  return returnStr;
}
var myCustomLevels = {
  levels: {
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    //colors aren't being used anywhere as of now, we're using chalk to add colors while logging
    info: 'blue',
    debug: 'green',
    warn: 'yellow',
    error: 'red',
  },
};

let logger: winston.Logger;
let errorLogger: winston.Logger;
let combineLogger: winston.Logger;

let successTransport;
let errorTransport;
let combineTransport;

function init(_logPath: string) {
  if (!logger || !errorLogger || !combineLogger) {
    const logsDir = path.resolve(sanitizePath(_logPath), 'logs', 'import');
    mkdirp.sync(logsDir);

    successTransport = {
      filename: path.join(sanitizePath(logsDir), 'success.log'),
      maxFiles: 20,
      maxsize: 1000000,
      tailable: true,
      level: 'info',
    };

    errorTransport = {
      filename: path.join(sanitizePath(logsDir), 'error.log'),
      maxFiles: 20,
      maxsize: 1000000,
      tailable: true,
      level: 'error',
    };

    combineTransport = {
      filename: path.join(sanitizePath(logsDir), 'combine.log'),
      maxFiles: 20,
      maxsize: 10000000,
      tailable: true,
      level: 'info',
    };

    logger = winston.createLogger({
      transports: [
        new winston.transports.File(successTransport),
        new winston.transports.File(combineTransport),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.simple(),
            winston.format.colorize({ all: true, colors: { warn: 'yellow', info: 'white' } }),
          ),
        }),
      ],
      levels: myCustomLevels.levels,
    });

    errorLogger = winston.createLogger({
      transports: [
        new winston.transports.File(errorTransport),
        new winston.transports.File(combineTransport),
        new winston.transports.Console({
          level: 'error',
          format: winston.format.combine(
            winston.format.colorize({ all: true, colors: { error: 'red' } }),
            winston.format.simple(),
          ),
        }),
      ],
      levels: { error: 0 },
    });

    combineLogger = winston.createLogger({
      transports: [
        new winston.transports.File(combineTransport),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.simple(),
            winston.format.colorize({ all: true, colors: { warn: 'yellow', info: 'white' } }),
          ),
        }),
      ],
      levels: myCustomLevels.levels,
    });
  }

  return {
    log: function (message: any) {
      let args = slice.call(arguments);
      let logString = returnString(args);
      if (logString) {
        logger.log('info', logString);
        combineLogger.log('info', logString);
      }
    },
    warn: function (message: any) {
      let args = slice.call(arguments);
      let logString = returnString(args);
      if (logString) {
        logger.log('warn', logString);
        combineLogger.log('info', logString);
      }
    },
    error: function (message: any) {
      let args = slice.call(arguments);
      let logString = returnString(args);
      if (logString) {
        errorLogger.log('error', logString);
        combineLogger.log('info', logString);
      }
    },
    debug: function () {
      let args = slice.call(arguments);
      let logString = returnString(args);
      if (logString) {
        logger.log('debug', logString);
      }
    },
  };
}

export const log = async (config: ImportConfig, message: any, type: string) => {
  config.cliLogsPath = config.cliLogsPath || config.data || path.join(__dirname, 'logs');
  // ignoring the type argument, as we are not using it to create a logfile anymore
  if (type !== 'error') {
    // removed type argument from init method
    if (type === 'warn') init(config.cliLogsPath).warn(message); //logged warning message in log file
    else init(config.cliLogsPath).log(message);
  } else {
    init(config.cliLogsPath).error(message);
  }
};

export const unlinkFileLogger = () => {
  if (logger) {
    const transports = logger.transports;
    transports.forEach((transport: any) => {
      if (transport.name === 'file') {
        logger.remove(transport);
      }
    });
  }

  if (errorLogger) {
    const transports = errorLogger.transports;
    transports.forEach((transport: any) => {
      if (transport.name === 'file') {
        errorLogger.remove(transport);
      }
    });
  }
};
