const router = require('koa-router')()
const AuJc = require('./aujc.js')

/** 路由模块配置  (前缀) */
router.prefix('/aujc')

// this.sendNotify = notify.wxpusherNotify
// this.sendNotify(`用户:${nickname},更新UID啦`, `亲爱的车主，用户：${nickname}，更新了UID：${uid}`)

// aujc中配置的 webhook，用于接收ck更新结果
router.post('/webhook', async (ctx, next) => {
  await next()
  // body = {"content": "{user,pt_pin,msg}"}
  const { content = ''} = ctx.request.body ?? {}
  let err_code = 0, message = 'success'
  try {
    const aujc = new AuJc()
    aujc.webhook(JSON.parse(content))
  } catch (error) {
    err_code = 1
    message = 'failed'
  }
  return ctx.body = { err_code, message, data:{} }
})

// aujc中配置的 webhook，用于获取短信验证码，超时 120 秒
// 从'/sendCode'取出对应短信验证码
router.post('/getCode', async (ctx, next) => {
  await next()
  // body = {"phone_number": phone}
  const { phone_number } = ctx.request.body ?? {}
  let err_code = 0, message = 'success', data = {}
  try {
    const aujc = new AuJc()
    const { code = '', msg = ''} = await aujc.getCode(phone_number)
    if (code) {
      data = { code }
    }
    else {
      err_code = -1
      message = msg
    }
  } catch (error) {
    err_code = 1
    message = 'failed'
  }
  return ctx.body = { err_code, message, data }
})

// 存储短信验证码
// 在aujc中配置了短信验证码识别登录
// 通过此接口进行缓存，等待aujc调用`getCode`接口获取验证码
router.post('/sendCode', async (ctx, next) => {
  await next()
  // body = {"phone_number": phone, "code": code}
  const { phone_number, code } = ctx.request.body ?? {}
  let err_code = 0, message = 'success'
  try {
    const aujc = new AuJc()
    aujc.sendCode(phone_number, code)
  } catch (error) {
    err_code = 1
    message = 'failed'
  }
  return ctx.body = { err_code, message, data: {} }
})


module.exports = router