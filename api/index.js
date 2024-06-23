const router = require('koa-router')()
const JDCK = require('./jdck/index.js')
const WxPusher = require('./wxpusher/index.js')

/** 路由模块配置  (前缀) */
router.prefix('/api')

// wxpusher 回调
const wxpusher = new WxPusher()

/** 
 * wxpusher 回调地址 
 * 文档地址 https://wxpusher.zjiecode.com/docs/#/?id=subscribe-callback
 */
router.post('/wxpusher/callback', wxpusher.callback)
/**
 * 获取二维码
 * @api {get} /wxpusher/qrcode 获取JD_COOKIE
 * @param {string} extra (pt_pin) 自定义字段
 */
router.get('/wxpusher/qrcode', wxpusher.getQRCode)

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


// JD_COOKIE
const jdck = new JDCK()
/**
 * @api {get} /sendSms 发送验证码
 * @apiName sendSms
 * @param {string} phone 手机号码
 */
router.get('/jd/sendSms', jdck.sendSms);

/**
 * @api {post} /checkCode 校验验证码
 * @apiName checkCode
 * @param {string} smscode 验证码
 * @param {JSON} body参数 sendSms接口中的body参数
 */
// router.post('/jd/checkCode', jdck.checkCode);
router.post('/jd/checkCode', async (ctx, next) => {
  await jdck.checkCode(ctx, next);
  let res = ctx.body
  console.log('/jd/checkCode checkCode res:', res)
  const { data, code } = res
  if (code === 200) {
    // jd 短信登录成功后提交CK
    res = await qlApi._submitCK(data.ck)
    console.log('/jd/checkCode submitCK res:', res)
    if (res.code === 200) {
      res.data = data
    }
  }
  ctx.body = res;
});


module.exports = router