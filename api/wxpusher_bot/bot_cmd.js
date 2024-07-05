const qlApi = require('../util/qlApi')
const log = require('../../utils/log_util.js');
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

// 自定义指令缓存 task id
var qlTaskMap = {}

const runTask = async (id = '') => {
  const res = await qlApi._runCronTask(id)
  return (res.code == 200) ? '任务执行成功' : '任务执行失败'
}

// 自定义指令，当前只支持青龙 task
const task = async (data = {}) => {
  // num: 1或者 1-n 或者 1,2,3
  const { name, command } = data
  const schedule = '7 29 2 * * *'
  log.info(`bot 开始执行自定义指令：${command}`)

  // 是否存在缓存
  const taskName = `bot@@${name}`
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
  const { content, run } = cmd
  const command = run
  if (!command) {
    return '指令:' + content + ' task 未找到'
  }

  const args = content.split(' ')
  let name = args[0] ?? ''
  let param = ""
  if (args.length > 1) {
    param = args[1]
  }

  // 解析参数
  // param: 1或者 n-m 或者 没有参数
  let start = 0, end = 0
  if (!param || param == '1') {
    start = 0
    end = 0
  }
  else if (param.includes('-')) {
    const arr = param.split('-')
    start = parseInt(arr[0] ?? 0)
    end = parseInt(arr[1] ?? 0)
  }

  var users = await jdckUsers()
  var user = findJDCKUser(users, uid)
  if (!user) {
    return '未查询到相关信息，请确保已经绑定微信推送，并关注公众号(wxpusher)后再试'
  }

  // 所有在线用户，最终的 desi 序号从这里产生
  const allOnlineUsers = users.filter(item => item.status == 0)
  // 指定用户
  users = allOnlineUsers.filter(item => item.uid == uid)
  if (users.length == 0) {
    return '用户未登录，请重新登录，再执行指令'
  }

  var nums = new Array()
  if (start == 0 || end == 0) {
    // 默认第一个
    const index = allOnlineUsers.findIndex(item => item.uid == uid)
    nums.push(index + 1)
  }
  else {
    start = Math.min(start, users.length)
    end = Math.min(end, users.length)
    end = Math.max(end, start)
    for (var i = start; i <= end; i++) {
      const user = users[i - 1]
      const index = allOnlineUsers.findIndex(item => item.id == user.id)
      nums.push(index + 1)
    }
  }

  // name: 任务名+uid 作为唯一标识
  name += `@@${uid}`
  return await task({ name, command: `${command} ${nums.join(',')}` })
}

// 服务器启动20秒后，开始缓存已经存在的自定义指令
const cacheCmd = async () => {
  log.info('开始缓存已经存在的自定义指令')
  let { data, code, message } = await qlApi._searchCronTask('bot')
  if (code == 200) {
    data.data.forEach(item => {
      qlTaskMap[item.name] = item.id
    })
    log.info(`自定义指令, 已缓存 ${data.total} 个任务`)
  }
  else {
    log.error('自定义指令 cacheCmd error = ' + message)
  }
}
setTimeout(cacheCmd, 20000)
log.info('20秒后，开始缓存已经存在的自定义指令')