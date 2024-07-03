const qlApi = require('../util/qlApi')

// return promise
// user = {id,pt_pin,remarks,phone,uid,status}
const jdckUsers = () => qlApi._getJDCKUser()

function findJDCKUser(users = [], uid = '') {
  return users.find(item => item.uid == uid)
}

// 绑定手机号码
const bind_jd_phone = async (data = {}) => {

}

// 发送短信验证码
const send_jd_sms = async (data = {}) => {

}

// 短信登录
const login_jd_sms = async (data = {}) => {

}

// CK在线情况
const ck_online = async (data) => {
  const users = await jdckUsers()

  var text = '用户在线情况：\n\n'
  users.forEach(item => {
    const online = item.status == 0 ? '启用' : '禁用'
    text += `用户：${item.pt_pin}\n备注：${item.remarks}\n状态：${item.online}\n\n`
  })

  return text
}

const internalCMD = {
  'bind_jd_phone': bind_jd_phone,
  'send_jd_sms': send_jd_sms,
  'login_jd_sms': login_jd_sms,
  'ck_online': ck_online
}

// 自定义指令，当前只支持青龙 task
const task = async (data = {}) => {

}

// 通过 备注里面的 uid 来找到当前用户
const checkUserInfo = async (uid) => {
  if (adminUID == uid) {
    return true
  }
  return false
}

// 系统内部指令
exports.internal = async (cmd = {}, uid = '') => {
  const args = cmd.split(' ')
  const name = args[0] ?? ""
  const run = internalCMD[name]
  if (!run) {
    return '未知指令：' + cmd
  }
  const param = args[1] ?? ""
  if (run) {
    return await run({ uid, param })
  }
  if (cmd.includes('ck_online')) {
  }
}

// 自定义指令
exports.custom = async (cmd = {}, uid = '') => {

}