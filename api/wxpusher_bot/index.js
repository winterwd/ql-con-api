const notify = require('../wxpusher/notify')
const { wxpusher_bot, wxpusher } = require('../../utils/config')
const adminUID = wxpusher.uid
const tail = `\n\n by: @${wxpusher_bot.bot_name}\n`

const guideTip = (isAdmin = false) => {
  var tip = `${wxpusher_bot.bot_tip}\n\n`

  tip += '内部指令: \n\n'
  wxpusher_bot.internal.forEach(cmd => {
    if (cmd.admin && !isAdmin) {
      return
    }

    tip += `「${cmd.name}」 ${cmd.desc}` + '\n'
    tip += `示例：${cmd.example}` + '\n\n'
  })

  tip += '自定义指令: \n\n'
  wxpusher_bot.custom.forEach(cmd => {
    if (cmd.admin && isAdmin) {
      return
    }

    tip += `「${cmd.name}」 ${cmd.desc}` + '\n'
    tip += `示例：${cmd.example}` + '\n\n'
  })

  return tip
}

const isGuideCMD = (content) => {
  return wxpusher_bot.guide.name == content
}

const bot_cmd = require('./bot_cmd')
exports.bot = async (data = {}) => {
  let { content, uid } = data
  const isAdmin = (adminUID == uid)

  var desp = '', text = `指令「${content}」已执行`
  if (isGuideCMD(content)) {
    text = wxpusher_bot.guide.desc
    desp = guideTip(isAdmin)
  }
  else {
    const cmdName = content.split(' ')[0] || ''
    var cmd = wxpusher_bot.internal.find(cmd => cmdName == cmd.name)
    if (cmd) {
      cmd.content = content
      desp = await bot_cmd.internal(cmd, uid)
    }
    else {
      cmd = wxpusher_bot.custom.find(cmd => cmdName == cmd.name)
      if (cmd) {
        cmd.content = content
        desp = await bot_cmd.custom(cmd, uid)
      }
      else {
        text = '未知指令：' + content
        desp += guideTip(isAdmin)
      }
    }
  }
  desp += tail

  notify.wxpusherNotify(text, desp, uid)
}