const log4js = require('log4js');
const log_config = require('../data/log_config.js');

//加载配置文件
log4js.configure(log_config);
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
  let logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
}

/**
 * 日志输出，level为info
 * @param {string} content 
 */
exports.info = (content) => {
  let logger = log4js.getLogger('info');
  logger.level = levels.info;
  logger.info(content);
}

/**
 * 日志输出，level为error
 * @param {string} content 
 */
exports.error = (content) => {
  let logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content);
}
