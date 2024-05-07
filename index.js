
const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')

/** 整体请求方式配置基本信息 */
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Content-Type', 'application/json')
  await next()
})

/** 引入api接口 */
const ql = require('./api/ql')

/** 请求需要加上 bodyParser */
app.use(bodyParser()).use(ql.routes(), ql.allowedMethods())

/**
 * 请求日志
 * methods、url、status、ms
 */
app.use(logger())

/** 项目启动端口 */
const host = 'http://127.0.0.1', port = 8970

/** 启动服务、监听端口 */
app.listen(port, () => {
  console.log(`app started at port ${host}:${port}`)
})
