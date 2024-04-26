
const router = require('koa-router')()

/** 路由模块配置  (前缀) */
router.prefix('/v1')

router.get('/jdck', async (ctx, next) => {
  await next()
  /** get 获取参数 ctx.query */
  ctx.body = JSON.stringify({
    code: 200,
    data: ctx.query || {}
  })
})

module.exports = router
