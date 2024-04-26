
const router = require('koa-router')()

/** 路由模块配置  (前缀) */
router.prefix('/v1')

router.post('/jdck', async (ctx, next) => {
  await next()
  ctx.body = {
    code: 200,
    data: ctx.request.body
  }
})

module.exports = router
