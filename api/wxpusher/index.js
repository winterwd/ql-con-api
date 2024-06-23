const request = require('request');
const Config = require('../util/config');

/**
 * 获取二维码
 * @param {string} [extra='']
 * https://wxpusher.zjiecode.com/docs/#/?id=create-qrcode
 * @return wxpusher 二维码
 */
async function fetchWxPusherQRCode(extra = '') {
  if (extra == undefined || extra == '') {
    return { code: 400, message: 'extra 不能为空' }
  }

  // 二维码请求地址
  const url = 'https://wxpusher.zjiecode.com/api/fun/create/qrcode'
  const appToken = Config.WXPUSHER_TOKEN
  var options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "appToken": appToken,
      "extra": extra ?? ""
    })
  }

  return new Promise((resolve, reject) => {
    request.post(options,
      function (error, response, body) {
        if (error !== null) {
          reject({ code: 400, message: '二维码获取失败' })
          return
        }

        console.log('二维码获取 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 1000) {
          resolve({ code: 200, data: result.data, message: '二维码获取成功' })
        } else {
          reject({ code: 400, message: body.msg })
        }
      })
  })
}

class WxPusher {
  constructor() {
  }

  /**
   * 用户扫码关注后，回调，通过 extra(pt_pin) 来更新 uid
   */
  async callback(ctx, next) {
    await next()

    // const callback = {
    //   "action": "app_subscribe",//动作，app_subscribe 表示用户关注应用回调，后期可能会添加其他动作，请做好兼容。
    //   "data": {
    //     "appId": 123,//创建的应用ID
    //     "appKey": "AK_xxxxxx", //关注应用的appKey，请不要再使用，将来可能会被删除
    //     "appName": "应用名字",
    //     "source": "scan", //用户关注渠道，scan表示扫码关注，link表示链接关注，command表示通过消息关注应用，后期可能还会添加其他渠道。
    //     "userName": "", //新用户微信不再返回 ，强制返回空
    //     "userHeadImg": "",//新用户微信不再返回 ，强制返回空
    //     "time": 1569416451573, //消息发生时间
    //     "uid": "UID_xxxxxx", //用户uid
    //     "extra": "xxx"    //用户扫描带参数的二维码，二维码携带的参数。扫描默认二维码为空
    //   }
    // }

    console.log('callback body = ' + JSON.stringify(ctx.request.body))
    const data = ctx.request.body.data ?? {}
    const { uid, extra } = data

    if (uid == undefined || uid == '') {
      // 没有 uid
      ctx.status = 400
      return ctx.body = { code: 400, message: '没有 uid' }
    }

    ctx.status = 200
    // 没有 extra 不做更新
    if (extra == undefined || extra == '') {
      ctx.body = { code: 400, message: '没有 extra' }
      return
    }

    ctx.body = { code: 200, message: '收到关注事件', data: { pt_pin: extra, uid: uid } }
  }

  /**
   * 获取二维码
   * @param {string} [extra=''] 对应青龙 CK 中的 pt_pin
   * @return wxpusher 二维码
   */
  async getQRCode(ctx, next) {
    await next()
    const extra = ctx.request.query.extra
    console.log('getQRCode extra = ' + extra)

    const res = await fetchWxPusherQRCode(extra)
    return ctx.body = res
  }
}

module.exports = WxPusher