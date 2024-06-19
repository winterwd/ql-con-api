const router = require('koa-router')()
const JDCK = require('./jdck/index.js')

/** 路由模块配置  (前缀) */
router.prefix('/api')

// wxpusher 回调
router.post('/wxpusher', require('./wxpusher').callback)

// 旧接口通过 CK 进行更新
router.post('/update/jdck', require('./ckTool').parseAndUpdateCK)
router.post('/parse_jdck', require('./ckTool').parseJDCK)
router.post('/update_jdck', require('./ckTool').updateJDCK)

// 京东ck
const jdck = new JDCK()
/**
 * @api {get} /sendSms 发送验证码
 * @apiName sendSms
 * @param {string} phone 手机号码
 */
router.get('/sendSms', jdck.sendSms);

/**
 * @api {post} /checkCode 校验验证码
 * @apiName checkCode
 * @param {string} smscode 验证码
 * @param {JSON} body参数 sendSms接口中的body参数
 */
router.post('/checkCode', jdck.checkCode);


module.exports = router