const notify = require('../wxpusher/notify')
const { wxpusher_bot, wxpusher } = require('../../utils/config')
const adminUID = wxpusher.uid
const tail = `\n\n by: @${wxpusher_bot.bot_name}\n`

const guideTip = (isAdmin = false) => {
  var tip = ''

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

const allCMD = () => {
  var all = new Array()
  all.concat(wxpusher_bot.internal.map(cmd => cmd))
  all.concat(wxpusher_bot.custom.map(cmd => cmd))
  return all
}

const isGuideCMD = (content) => {
  return wxpusher_bot.guide.name == content
}

const bot_cmd = require('./bot_cmd')
exports.bot = async (data = {}) => {
  let { content, uid } = data
  const isAdmin = (adminUID == uid)

  var desp = '', text = '点击查看结果'
  if (isGuideCMD(content)) {
    desp = guideTip(isAdmin)
  }
  else {
    var cmd = wxpusher_bot.internal.find(cmd => content.includes(cmd.name))
    if (cmd) {
      text = `指令：${cmd.name} 已执行`
      bot_cmd.internal(cmd, uid)
    }
    else {
      cmd = wxpusher_bot.custom.find(cmd => content.includes(cmd.name))
      if (cmd) {
        text = `指令：${cmd.name} 已执行`
        bot_cmd.custom(cmd, uid)
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