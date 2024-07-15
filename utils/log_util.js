/**
 * log4js 配置文件
 * 
 * 日志等级由低到高
 * ALL TRACE DEBUG INFO WARN ERROR FATAL OFF. 
 * 
 * 关于log4js的appenders的配置说明
 * https://github.com/nomiddlename/log4js-node/wiki/Appenders
 */

const log4js = require('log4js');
const rootDir = require('./rootDir')
const { site } = require('./config')

//日志根目录
const baseLogPath = rootDir + '/data/logs'
const fileName = "jdck";
const jdckLogPath = baseLogPath + "/" + fileName;
const pattern = 'yyyy-MM-dd.log';

//配置
const config = {
  appenders: {
    console: { type: 'console' },
    info: {
      type: 'dateFile',
      filename: jdckLogPath,
      pattern: pattern,
      alwaysIncludePattern: true,
      numBackups: site.log_days ?? 1
    },
    error: {
      type: 'dateFile',
      filename: jdckLogPath,
      pattern: pattern,
      alwaysIncludePattern: true,
      numBackups: site.log_days ?? 1
    }
  },
  //指定哪些追加器可以输出来
  categories: {
    default: {
      appenders: ['console'],
      level: 'debug'
    },
    info: {
      appenders: ['info', 'console'],
      level: 'info'
    },
    error: {
      appenders: ['error', 'console'],
      level: 'error'
    }
  }
}

//加载配置文件
log4js.configure(config);
const levels = {
  'trace': log4js.levels.TRACE,//固定常量
  'debug': log4js.levels.DEBUG,
  'info': log4js.levels.INFO,
  'warn': log4js.levels.WARN,
  'error': log4js.levels.ERROR,
  'fatal': log4js.levels.FATAL,
}

/**
 * 日志输出，level为debug
 * @param {string} content 
 */
exports.debug = (content) => {
  if (!site.log_enable) return;
  let logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
}

/**
 * 日志输出，level为info
 * @param {string} content 
 */
exports.info = (content) => {
  if (!site.log_enable) return;
  let logger = log4js.getLogger('info');
  logger.level = levels.info;
  logger.info(content);
}

/**
 * 日志输出，level为error
 * @param {string} content 
 */
exports.error = (content) => {
  if (!site.log_enable) return;
  let logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content);
}
