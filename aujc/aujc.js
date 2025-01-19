const qlApi = require('../api/util/qlApi')
const notify = require('../api/wxpusher/notify')
const { wxpusher } = require('../utils/config');
const log = require('../utils/log_util.js')

// 缓存短信验证码
// key: phone
// value: {code, timestamp}
var CacheCode = {}
// 短信验证码过期时间
const CodeTimeout = 3 * 60 * 1000

// 等待
function sleep(s) {
  const ms = s*1000
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

// AuJc
class AuJc {
  constructor() {
  }

  async webhook(data = {}) {
    const { user: phone = '', pt_pin = '', msg = '' } = data
    log.info(`AuJc webhook phone:${phone}, pt_pin:${pt_pin}, msg:${msg}`)
    if (phone && pt_pin) {
      const user = await qlApi._getEnvUser(pt_pin)
      if (user) {
        const desp = `jdck用户(${user.remarks})${msg}`
        this._sendNotify(desp, user.uid)
      }
      else {
        log.error(`AuJc webhook user:${pt_pin} not found`)
      }
    }
  }

  _sendNotify(text, uid) {
    const desp = ' 这条通知显示更新成功，请忽略，如果显示失败，请联系车主或手动更新！'
    // 给用户和车主发送自动登录结果
    // notify.wxpusherNotify(text, desp, wxpusher.uid)
    try {
      notify.wxpusherNotify(text, desp, `${uid};${wxpusher.uid}`)
    } catch (error) {
      log.error(`AuJc _sendNotify error: ${error}`)
    }
  }

  // 从CacheCode中获取短信验证码
  async getCode(phone ='') {
    log.info(`AuJc getCode phone:${phone}`)
    if (phone) {
      const start_time = Date.now()
      while (true) {
        const code = CacheCode[phone]?.code
        if (code) {
          delete CacheCode[phone]
          return { code }
        }
        if (Date.now() - start_time > CodeTimeout) {
          return { msg: '获取验证码超时'}
        }
        await sleep(2)
        log.info(`AuJc getCode phone:${phone} sleep 2`)
      }
    }
    else {
      return { msg: 'phone not found'}
    }
  }

  sendCode(phone='', code='') {
    log.info(`AuJc sendCode phone:${phone}, code:${code}`)
    this._cleanCode()
    if (phone && code) {
      CacheCode[phone] = { code, timestamp: Date.now() }
    }
  }

  // 清除过期短信验证码
  _cleanCode() {
    Object.keys(CacheCode).forEach(key => {
      if (Date.now() - CacheCode[key].timestamp > CodeTimeout) {
        delete CacheCode[key]
      }
    })
  }
}

module.exports = AuJc