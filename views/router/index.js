// router/index.js
const Router = require('koa-router')

const title = "阿卡+的薅豆车"

// 首页
const home = new Router()

async function homeView(ctx) {
  console.log('start homeView')
  // 清除ck
  const data = JSON.parse(localStorage.getItem('data'));
  if (data) {
    data.ck = ''
    localStorage.setItem('data', JSON.stringify(data));
  }
  await ctx.render('home', { title })
}

home.get('/', homeView)
.get('/home', homeView)

const info = new Router()
info.get('/', async (ctx) => {
  console.log('start info view')
  const data = JSON.parse(localStorage.getItem('data'));
  console.log('data = ', data)
  const { ck } = data
  if (ck) {
    // 已经登录
    await ctx.render('info', { title })
  } else {
    // 重定向
    ctx.redirect('/home')
  }
})

// 装载所有子路由
let router = new Router()
router.use('/', home.routes(), home.allowedMethods())
router.use('/home', home.routes(), home.allowedMethods())
router.use('/info', info.routes(), info.allowedMethods())

module.exports = router