
/**
 * 获取青龙脚本文件
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @return 青龙脚本文件
 */
async function getWxPusherUidConfig(token) {
  try {
    const { code, data, message } = await ql.getWxPusherUidConfig(token, QL_CONFIG.QL_ADDR)
    console.log('getQLScriptFile ' + 'code = ' + code + ', message = ' + message)
    return { code, data, message }
  } catch (error) {
    return error;
  }
}

async function callback(ctx, next) {
  await next()

  const code = 200
  const message = 'success'
  const data = ctx.request.body
  return ctx.body = { code, message, data }
}

module.exports = {
  callback
}