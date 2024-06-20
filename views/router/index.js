// router/index.js
const Router = require('koa-router')

const title = "阿卡+的薅豆车"

// 首页
const home = new Router()

async function homeView(ctx) {
  console.log('start homeView')
  await ctx.render('home', { title })
}

home.get('/', homeView)
.get('/home', homeView)

const info = new Router()
info.get('/', async (ctx) => {
  console.log('start info view')
  await ctx.render('info', { title })
})

// 装载所有子路由
let router = new Router()
router.use('/', home.routes(), home.allowedMethods())
router.use('/home', home.routes(), home.allowedMethods())
router.use('/info', info.routes(), info.allowedMethods())

module.exports = router