
const Koa = require('koa')
const app = new Koa()
const logger = require('koa-logger')
const bodyParser = require('koa-bodyparser')

const ApiRouter = require('./api/index')
const ViewsRouter = require('./views/router/index')

const path = require('path')
const views = require('koa-views')
const statics =  require('koa-static')

const staticPath = './views/static'

app.use(statics(
  path.join(__dirname, staticPath)
))

// 加载模板引擎
app.use(views(path.join(__dirname, './views'), {
    extension: 'ejs'
}))

/** 整体请求方式配置基本信息 */
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Content-Type', 'application/json')
  await next()
})

/** 请求需要加上 bodyParser */
app.use(bodyParser())

// 加载路由中间件
app.use(ApiRouter.routes()).use(ApiRouter.allowedMethods())
app.use(ViewsRouter.routes()).use(ViewsRouter.allowedMethods())

//// 捕获所有未处理的路由
// app.use(async(ctx, next) => {
//   try {
//     await next()
//     const status = ctx.status || 404
//     console.log('app.ctx.status:', status)
//     console.log('app.ctx.request.url:', ctx.request.url)
//     if (status === 404) {
//         ctx.throw(404)
//     }
//   } catch (err) {
//     ctx.status = err.status || 500
//     if (ctx.status === 404) {
//       await ctx.render('404')
//     } else {
//       //other_error
//       await ctx.render('404')
//     }
//   }
// })

/** 日志 */
app.use(logger())

/** 项目启动端口 */
const host = 'http://127.0.0.1', port = 8970

/** 启动服务、监听端口 */
app.listen(port, () => {
  console.log(`app started at port ${host}:${port}`)
})
