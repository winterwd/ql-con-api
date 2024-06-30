/**
 * log4js 配置文件
 * 
 * 日志等级由低到高
 * ALL TRACE DEBUG INFO WARN ERROR FATAL OFF. 
 * 
 * 关于log4js的appenders的配置说明
 * https://github.com/nomiddlename/log4js-node/wiki/Appenders
 */

const path = require('path');

//日志根目录
const baseLogPath = path.resolve(__dirname, './logs')
const fileName = "jdck";
const jdckLogPath = baseLogPath + "/" + fileName;
const pattern = 'yyyy-MM-dd.log';

//配置
const config = {
  appenders: {
    console: { type: 'console' },//追加器1
    info: {//追加器2
      type: 'dateFile',
      filename: jdckLogPath,
      pattern: pattern,
      alwaysIncludePattern: true
    },
    error: {//追加器3
      type: 'dateFile',
      filename: jdckLogPath,
      pattern: pattern,
      alwaysIncludePattern: true// 设置文件名称为 filename + pattern
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

module.exports = config