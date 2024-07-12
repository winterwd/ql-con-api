// router/index.js
const Router = require('koa-router')
const { site } = require('../../utils/config');

const title = site.site_name ?? "薅豆车"

// 首页
const home = new Router()

async function homeView(ctx) {
  await ctx.render('home', { title })
}

home.get('/', homeView)
  .get('/home', homeView)

// info
const info = new Router()
info.get('/', async (ctx) => {
  await ctx.render('info', { title })
})

// 装载所有子路由
let router = new Router()
router.use('/', home.routes(), home.allowedMethods())
router.use('/home', home.routes(), home.allowedMethods())
router.use('/info', info.routes(), info.allowedMethods())

module.exports = router