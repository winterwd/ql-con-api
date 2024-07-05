const request = require('request');
const { wxpusher } = require('../../utils/config');

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
  const appToken = wxpusher.appToken
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
    request(options,
      function (error, response, body) {
        if (error !== null) {
          reject({ code: 400, message: '二维码获取失败' })
          return
        }

        const result = JSON.parse(body)
        if (result.code == 1000) {
          resolve({ code: 200, data: result.data, message: '二维码获取成功' })
        } else {
          reject({ code: 400, message: result.msg })
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
  async callback(body = {}) {
    // const body = {
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

    // const body = {
    //   "action": "send_up_cmd",//动作，send_up_cmd 表示上行消息回调，后期可能会添加其他动作，请做好兼容。
    //   "data": {
    //     "uid": "UID_xxx",//用户uid
    //     "appId": 97, //应用id
    //     "appName": "WxPusher演示",//应用名称
    //     "time": 1603002697386,//发生时间
    //     "content": "内容" //用户发送的内容
    //   }
    // }

    const { data, action } = body
    const { uid } = data

    if (uid == undefined || uid == '') {
      // 没有 uid
      return { code: 400, message: '没有 uid' }
    }

    if (action == 'app_subscribe') {
      // 用户关注事件
      return this._app_subscribe(data)
    }
    else if (action == 'send_up_cmd') {
      // 上行消息事件
      return this._send_up_cmd(data)
    }
    return { code: 400, message: '没有找到相应的 action 回调' }
  }

  _app_subscribe(data = {}) {
    const { uid, extra } = data
    // 没有 extra 不做更新
    if (extra == undefined || extra == '') {
      return { code: 400, message: '没有 extra' }
    }

    return { code: 200, message: '收到关注事件', data: { pt_pin: extra, uid: uid, action: 'app_subscribe' } }
  }

  _send_up_cmd(data = {}) {
    var { uid, content } = data
    // 没有 content
    if (content == undefined || content == '') {
      return { code: 400, message: '没有 content' }
    }
    // -xxx 指令
    // #xxx 指令
    content = content.replace(`-${wxpusher.appId}`, '')
    content = content.replace(`#${wxpusher.appId}`, '')
    content = content.trim()
    return { code: 200, message: '收到指令', data: { content: content, uid: uid, action: 'send_up_cmd' } }
  }

  /**
   * 获取二维码
   * @param {string} [extra=''] 对应青龙 CK 中的 pt_pin
   * @return wxpusher 二维码
   */
  async getQRCode(extra = '') {
    try {
      const res = await fetchWxPusherQRCode(extra)
      return res
    } catch (error) {
      return { code: 400, message: JSON.stringify(error) }
    }
  }
}

module.exports = WxPusher