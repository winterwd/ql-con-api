const qlApi = require('../util/qlApi')
const log = require('../../utils/log_util.js');
const request = require('request')
const CmdPrefix = 'bot@@'

// return promise
// user = {id,pt_pin,remarks,phone,uid,status}
const jdckUsers = () => qlApi._getJDCKUser()

// 绑定手机号码
const bind_jd_phone = async (data = {}) => {
  const { uid, param } = data
  let phone = param[0] || ''
  let num = parseInt(param[1]) || 1

  // 是否有效的手机号
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!(phoneRegex.test(phone))) {
    return '请输入有效的手机号'
  }

  var users = await jdckUsers()
  users = users.filter(item => item.uid == uid)
  if (users.length < num) {
    return '指令序号不对，请重新输入'
  }
  
  var user = users[num - 1]
  user.phone = phone
  const { code, message } = await qlApi._updateJDCKUser(user)
  if (code == 200) {
    return `手机号:${phone} 绑定成功`
  }
  else {
    return message
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
        try {
          const result = JSON.parse(body) ?? {}
          resolve(result)
        } catch (error) {
          reject(error)
        }
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
  const { uid, param } = data
  let num = parseInt(param[0]) || 1

  var users = await jdckUsers()
  users = users.filter(item => item.uid == uid)
  if (users.length < num) {
    return '指令序号不对，请重新输入'
  }

  var user = users[num - 1]
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
  let smscode = param[0] || ''

  const regex = /^\d{6}$/;
  if (!regex.test(smscode)) {
    return '验证码格式错误, 请输入6位数字验证码'
  }

  let num = parseInt(param[1]) || 1
  var users = await jdckUsers()
  users = users.filter(item => item.uid == uid)
  if (users.length < num) {
    return '指令序号不对，请重新输入'
  }

  var user = users[num - 1]
  if (!user.phone) {
    return '请先绑定手机号码'
  }

  // 校验登录
  let key = user.uid + user.phone
  var last = jdSmsMap[key]
  if (!last || (last.time + 180 * 1000) < (new Date().getTime())) {
    removeInvaildJDSMS(key)
    return '验证码未发送或已失效，请重新发送'
  }

  const { message } = await login_jd_sms_api({ smscode, user })
  // 校验登录结束，移除缓存
  removeInvaildJDSMS(key)
  return message

}

const ck_info = async (data) => {
  const { uid } = data
  var users = await jdckUsers()
  users = users.filter(item => item.uid == uid)

  var text = '用户信息列表：\n\n'
  users.forEach((item, index) => {
    const online = item.status == 0 ? '启用' : '禁用'
    const phone = item.phone ? '已绑定' : '未绑定'
    const time = new Date(item.updatedAt ?? '').toLocaleString()
    text += `序号：${index + 1}\n用户：${item.pt_pin}\n状态：${online}\n备注：${item.remarks}\n手机：${phone}\n更新时间：${time}\n\n`
  })
  return text
}

// CK在线情况
const ck_online = async (data) => {
  const users = await jdckUsers()

  var text = '用户在线情况：\n\n'
  users.forEach(item => {
    const online = item.status == 0 ? '启用' : '禁用'
    const wxpusher = item.uid ? '已绑定' : '未绑定'
    const phone = item.phone ? '已绑定' : '未绑定'
    const time = new Date(item.updatedAt ?? '').toLocaleString()
    text += `用户：${item.pt_pin}\n状态：${online}\n备注：${item.remarks}\n微信：${wxpusher}\n手机：${phone}\n更新时间：${time}\n\n`
  })

  return text
}

// CK离线情况
const ck_offline = async (data) => {
  var users = await jdckUsers()
  users = users.filter(item => item.status != 0)

  var text = '用户离线情况：\n\n'
  users.forEach(item => {
    const wxpusher = item.uid ? '已绑定' : '未绑定'
    const phone = item.phone ? '已绑定' : '未绑定'
    const time = new Date(item.updatedAt ?? '').toLocaleString()
    text += `用户：${item.pt_pin}\n备注：${item.remarks}\n微信：${wxpusher}\n手机：${phone}\n更新时间：${time}\n\n`
  })

  return text
}

const internalCMD = {
  'bind_jd_phone': bind_jd_phone,
  'send_jd_sms': send_jd_sms,
  'login_jd_sms': login_jd_sms,
  'ck_info': ck_info,
  'ck_online': ck_online,
  'ck_offline': ck_offline
}

// 系统内部指令
exports.internal = async (cmd = {}, uid = '') => {
  const { content, run } = cmd
  const func = internalCMD[run]
  if (!func) {
    return '未知指令：' + content
  }

  const args = content.split(' ')
  const param = args.slice(1)
  return await func({ uid, param })
}

// 自定义指令缓存 task id
var qlTaskMap = {}

const runTask = async (id = '') => {
  const res = await qlApi._runCronTask(id)
  return (res.code == 200) ? '任务执行成功' : '任务执行失败'
}

// 自定义指令，当前只支持青龙 task
const task = async (data = {}) => {
  const { name, command } = data
  const schedule = data.schedule || '1 1 29 2 *'
  log.info(`bot 开始执行自定义指令：${command}`)

  // 是否存在缓存
  const taskName = `${CmdPrefix}${name}`
  let taskId = qlTaskMap[taskName] ?? -1
  if (taskId == -1) {
    const cronData = {
      name: taskName,
      schedule,
      command
    }
    const { data, message } = await qlApi._createCronTask(cronData)
    if (data) {
      // 创建成功
      taskId = data.id
      qlTaskMap[taskName] = taskId
      return await runTask(taskId)
    }
    else {
      // 创建失败
      log.error('bot 自定义指 task error = ' + message)
      return '任务创建失败, 请联系管理员'
    }
  }
  else {
    // 存在缓存，尝试更新，可作为检查任务是否存在，也一并更新
    const cronData = {
      id: taskId,
      schedule,
      command
    }
    const { code, message } = await qlApi._updateCronTask(cronData)
    // code:500, message: "Cron {\"id\":2830} not found"
    if ((code == 500) && message.includes('not found')) {
      qlTaskMap[taskName] = -1
      return await task(data)
    }
    else {
      // 更新成功
      return await runTask(taskId)
    }
  }
}

// 自定义指令
exports.custom = async (cmd = {}, uid = '') => {
  const { content, run, schedule } = cmd
  const command = run
  if (!command) {
    return '指令:' + content + ' task 未找到'
  }

  const args = content.split(' ')
  let name = args[0] || '任务'
  let param = 1
  if (args.length > 1) {
    param = parseInt(args[1]) || 1
  }
  param = Math.max(param, 1)

  var users = await jdckUsers()
  // 同一个uid下绑定的用户
  var currentUsers = users.filter(item => item.uid == uid)
  if (currentUsers.length < param) {
    return `指令参数错误，当前只有 ${currentUsers.length} 个账号可用`
  }

  const user = currentUsers[param - 1]
  // 所有在线用户，最终的 desi 序号从这里产生
  const allOnlineUsers = users.filter(item => item.status == 0)
  const num = allOnlineUsers.findIndex(item => item.uid == uid)
  if (num < 0) {
    return '指定账号不在线，请重新登录后，再执行指令'
  }

  // name: 任务名+uid 作为唯一标识
  name += `@@${uid}`
  return await task({ name, command: `${command} ${num + 1}`, schedule })

  // // 解析参数
  // // param: 1或者 n-m 或者 没有参数
  // let start = 0, end = 0
  // if (!param || param == '1') {
  //   start = 0
  //   end = 0
  // }
  // else if (param.includes('-')) {
  //   const arr = param.split('-')
  //   start = parseInt(arr[0] ?? 0)
  //   end = parseInt(arr[1] ?? 0)
  // }

  // var users = await jdckUsers()
  // var user = findJDCKUser(users, uid)
  // if (!user) {
  //   return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'
  // }

  // // 所有在线用户，最终的 desi 序号从这里产生
  // const allOnlineUsers = users.filter(item => item.status == 0)
  // // 指定用户
  // users = allOnlineUsers.filter(item => item.uid == uid)
  // if (users.length == 0) {
  //   return '用户未登录，请重新登录，再执行指令'
  // }

  // var nums = new Array()
  // if (start == 0 || end == 0) {
  //   // 默认第一个
  //   const index = allOnlineUsers.findIndex(item => item.uid == uid)
  //   nums.push(index + 1)
  // }
  // else {
  //   start = Math.min(start, users.length)
  //   end = Math.min(end, users.length)
  //   end = Math.max(end, start)
  //   for (var i = start; i <= end; i++) {
  //     const user = users[i - 1]
  //     const index = allOnlineUsers.findIndex(item => item.id == user.id)
  //     nums.push(index + 1)
  //   }
  // }

  // // name: 任务名+uid 作为唯一标识
  // name += `@@${uid}`
  // return await task({ name, command: `${command} ${nums.join(',')}`, schedule })
}

// 服务器启动20秒后，开始缓存已经存在的自定义指令
const cacheCmd = async () => {
  log.info('开始缓存已经存在的自定义指令')
  let { data, code, message } = await qlApi._searchCronTask(CmdPrefix)
  if (code == 200) {
    try {
      let array = []
      if (Array.isArray(data)) {
        array = data
      }
      else if (Array.isArray(data.data)) {
        array = data.data
      }
      else {
        log.info(`自定义指令, 获取任务列表 error = ${message}`)
        return
      }

      array.forEach(item => {
        qlTaskMap[item.name] = item.id
      })
      log.info(`自定义指令, 已缓存 ${array.length} 个任务`)
    } catch (error) {
      log.error('自定义指令 cacheCmd error = ' + JSON.stringify(error))
    }
  }
  else {
    log.error('自定义指令 cacheCmd error = ' + message)
  }
}

const seconds = 15
setTimeout(cacheCmd, seconds * 1000)
log.info(`${seconds}秒后，开始缓存已经存在的自定义指令`)