const qlApi = require('../util/qlApi')
const request = require('request')

// return promise
// user = {id,pt_pin,remarks,phone,uid,status}
const jdckUsers = () => qlApi._getJDCKUser()

// 通过 备注里面的 uid 来找到当前用户
function findJDCKUser(users = [], uid = '') {
  return users.find(item => item.uid == uid)
}

// 绑定手机号码
const bind_jd_phone = async (data = {}) => {
  const { uid, param } = data
  // param 是否有效的手机号
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!(phoneRegex.test(param))) {
    return '请输入有效的手机号'
  }

  var user = findJDCKUser(await jdckUsers(), uid)
  if (user) {
    user.phone = param
    const { code, message } = await qlApi._updateJDCKUser(user)
    if (code == 200) {
      return `手机号:${param} 绑定成功`
    }
    else {
      return message
    }
  }
  else {
    return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'
  }
}

// 缓存发送短信验证后的数据 key: uid+phone 
// 6分钟内有效
var jdSmsMap = {}
const removeInvaildJDSMS = (key) => jdSmsMap[key] = null;

const someApiRequest = async (options = {}) => {
  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        reject(error)
      }
      else {
        const result = JSON.parse(body) ?? {}
        resolve(result)
      }
    });
  })
}

const send_jd_sms_api = async (data = '') => {
  const phone = data
  const url = 'http://127.0.0.1:8864/api/jd/sendSms' + '?phone=' + phone
  var options = {
    'method': 'GET',
    'url': url,
    'headers': {
      'Content-Type': 'application/json'
    }
  };

  return someApiRequest(options)
}

// 发送短信验证码
const send_jd_sms = async (data = {}) => {
  const { uid } = data

  var user = findJDCKUser(await jdckUsers(), uid)
  if (user) {
    if (!user.phone) {
      return '请先绑定手机号码'
    }
    let key = user.uid + user.phone
    var last = jdSmsMap[key]
    if (last && (last.time + 300 * 1000) > (new Date().getTime())) {
      return '验证码已发送，请验证登录。如果没收到，请稍后再试！'
    }

    const { code, message, data } = await send_jd_sms_api(user.phone)
    if (code == 200) {
      // 发送成功，需要缓存 data，用作下一步校验
      jdSmsMap[key] = { data, time: (new Date().getTime()) }
      return '验证码发送成功'
    }
    else {
      return message
    }
  }
  else {
    return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'
  }
}

const login_jd_sms_api = async (data = {}) => {
  const { smscode = '', user = {} } = data
  const url = 'http://127.0.0.1:8864/api/jd/checkCode' + '?smscode=' + smscode
  var options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  };

  return someApiRequest(options)
}

// 短信登录
const login_jd_sms = async (data = {}) => {
  const { uid, param } = data

  const regex = /^\d{6}$/;
  if (!regex.test(param)) {
    return '验证码格式错误, 请输入6位数字验证码'
  }

  // 校验登录
  var user = findJDCKUser(await jdckUsers(), uid)
  if (user) {
    if (!user.phone) {
      return '请先绑定手机号码'
    }
    let key = user.uid + user.phone
    var last = jdSmsMap[key]
    if (!last || (last.time + 300 * 1000) < (new Date().getTime())) {
      removeInvaildJDSMS(key)
      return '验证码未发送或已失效，请重新发送'
    }

    const { message } = await login_jd_sms_api({ smscode: param, user })
    // 校验登录结束，移除缓存
    removeInvaildJDSMS(key)
    return message
  }
  else {
    return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'
  }
}

// CK在线情况
const ck_online = async (data) => {
  const users = await jdckUsers()

  var text = '用户在线情况：\n\n'
  users.forEach(item => {
    const online = item.status == 0 ? '启用' : '禁用'
    const wxpusher = item.uid ? '已绑定' : '未绑定'
    const phone = item.phone ? '已绑定' : '未绑定'
    text += `用户：${item.pt_pin}\n状态：${online}\n备注：${item.remarks}\n微信：${wxpusher}\n手机：${phone}\n\n`
  })

  return text
}

const internalCMD = {
  'bind_jd_phone': bind_jd_phone,
  'send_jd_sms': send_jd_sms,
  'login_jd_sms': login_jd_sms,
  'ck_online': ck_online
}

// 系统内部指令
exports.internal = async (cmd = {}, uid = '') => {
  const { content, run } = cmd
  const func = internalCMD[run]
  if (!func) {
    return '未知指令：' + content
  }

  const args = content.split(' ')
  let param = ""
  if (args.length > 1) {
    param = args[1]
  }

  if (func) {
    return await func({ uid, param })
  }
  if (cmd.includes('ck_online')) {
  }
}

const getQLTask = async (id) => {
  const phone = data
  const url = 'http://127.0.0.1:8864/api/jd/sendSms' + '?phone=' + phone
  var options = {
    'method': 'GET',
    'url': url,
    'headers': {
      'Content-Type': 'application/json'
    }
  };

  return someApiRequest(options)
}

// 自定义指令缓存 task id
var qlTaskMap = {}
// 自定义指令，当前只支持青龙 task
const task = async (data = {}) => {
  const { name, task, index = -1 } = data
  const taskName = `bot_${name}`
  const schedule = '7 29 2 * * *'
}

// 自定义指令
exports.custom = async (cmd = {}, uid = '') => {
  const { content, run } = cmd
  const task = run
  if (!task) {
    return '指令:' + content + ' task 未找到'
  }

  const args = content.split(' ')
  let name = args[0] ?? ''
  // let param = ""
  // if (args.length > 1) {
  //   param = args[1]
  // }
  // index: 指定 0，默认第一个

  var users = await jdckUsers()
  var user = findJDCKUser(users, uid)
  if (!user) {
    return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'

  }
  users = users.filter(item => item.status == 0)
  user = findJDCKUser(users, uid)
  if (!user) {
    return '用户未登录，请重新登录，再执行指令'
  }

  const index = users.findIndex(item => item.uid == uid)
  if (index == -1) {
    return '指令执行失败，未找到用户'
  }

  name += user.pt_pin
  return await task({ name, task, index: `${index}` })
}