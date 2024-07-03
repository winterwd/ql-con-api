const router = require('koa-router')()
const RateLimit = require('koa2-ratelimit').RateLimit;

const JDCK = require('./jdck/index.js')
const WxPusher = require('./wxpusher/index.js')
const log = require('../utils/log_util');

/** 路由模块配置  (前缀) */
router.prefix('/api')

// wxpusher 回调
const wxpusher = new WxPusher()

/** 
 * wxpusher 回调地址 
 * 文档地址 https://wxpusher.zjiecode.com/docs/#/?id=subscribe-callback
 */
// router.post('/wxpusher', wxpusher.callback)
const wxpusher_bot = require('./wxpusher_bot/index.js')
router.post('/wxpusher', async (ctx, next) => {
  await next()
  const body = ctx.request.body ?? {}
  log.info('wxpusher request body:' + JSON.stringify(body))
  var res = await wxpusher.callback(body)

  const { data, code = 400, message = '未知错误' } = res
  ctx.status = 200
  ctx.body = { code, message }

  if (code == 200) {
    // 成功收到用户回调事件
    const { action } = data ?? {}
    if (action == 'app_subscribe') {
      qlApi._updateWxPusherUid(data)
    }
    else if (action == 'send_up_cmd') {
      log.info('wxpusher send_up_cmd content:' + data.content)
      wxpusher_bot.bot(data)
    }
  }
})

/**
 * 获取二维码
 * @api {get} /wxpusher/qrcode 获取JD_COOKIE
 * @param {string} extra (pt_pin) 自定义字段
 */
router.get('/wxpusher/qrcode', async (ctx, next) => {
  await next()
  const extra = ctx.request.query.extra
  log.info('wxpusher getQRCode extra = ' + extra)

  const res = await wxpusher.getQRCode(extra)
  log.info('wxpusher getQRCode res ' + (res.code == 200 ? 'success' : 'fail'))
  return ctx.body = res
})

// 新的 api
const QLAPI = require('./util/qlApi')
const qlApi = new QLAPI()
/**
 * @api {get} /ql/jdck 获取JD_COOKIE
 * @param {string} pt_pin JD_COOKIE
 */
router.get('/ql/jdck', qlApi.getJDCK)
/**
 * @api {post} /ql/jdck_set 提交JD_COOKIE
 * @param {string} ck JD_COOKIE
 */
router.post('/ql/jdck_set', qlApi.submitCK)
/**
 * 解析并提交JD_COOKIE
 * @api {post} /ql/parse_jdck_set 提交JD_COOKIE
 * @param {string} ck web端 cookie
 */
router.post('/ql/parse_jdck_set', qlApi.parseAndSubmitCK)
/**
 * @api {post} /ql/remarks 修改备注
 * @param {string} pt_pin JD_COOKIE
 * @param {string} remarks 备注
 */
router.post('/ql/remarks', qlApi.updateRemarks)
/**
 * @api {post} /ql/wxpusher_uid 修改微信推送uid
 * @param {string} pt_pin JD_COOKIE
 * @param {string} uid uid
 */
router.post('/ql/wxpusher_uid', qlApi.updateWxPusherUid)

const apiLimiter = RateLimit.middleware({
  interval: { sec: 5 }, // 1h30 window
  delayAfter: 1, // begin slowing down responses after the first request
  timeWait: 3 * 1000, // slow down subsequent responses by 3 seconds per request
  max: 1, // start blocking after 5 requests
  message: "手速有点快呀！请慢一点！",
  messageKey: "message"
});

// JD_COOKIE
const jdck = new JDCK()
/**
 * @api {get} /sendSms 发送验证码
 * @apiName sendSms
 * @param {string} phone 手机号码
 */
router.get('/jd/sendSms', apiLimiter, jdck.sendSms);

/**
 * @api {post} /checkCode 校验验证码
 * @apiName checkCode
 * @param {string} smscode 验证码
 * @param {JSON} body参数 sendSms接口中的body参数
 */
// router.post('/jd/checkCode', jdck.checkCode);
router.post('/jd/checkCode', apiLimiter, async (ctx, next) => {
  await jdck.checkCode(ctx, next);
  let res = ctx.body
  const { data, code } = res
  if (code === 200) {
    // jd 短信登录成功后提交CK
    const ckRes = await qlApi._submitCK(data.ck)
    if (ckRes.code !== 200) {
      ckRes.message = "提交失败, 请点击下方'重新提交'"
    }
    // 将登录的 CK 传下去
    ckRes.data = data
    res = ckRes
  }
  ctx.body = res;
});


module.exports = router