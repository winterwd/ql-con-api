const log = require('../../utils/log_util')
const JDLib = require('./dejdLib')

class JDCK {
  constructor() {
    this.isDev = process.env.npm_lifecycle_event == 'dev'
    log.info(`jdck process ${this.isDev ? 'dev' : 'product'} mode`)

    this.sendSms = this.sendSms.bind(this)
    this.checkCode = this.checkCode.bind(this)
    this.realSendSms = this.realSendSms.bind(this)
    this.realCheckCode = this.realCheckCode.bind(this)

    if (this.isDev) {
      this.mockSendSms = this.mockSendSms.bind(this)
      this.mockCheckCode = this.mockCheckCode.bind(this)
    }
    else {
      this._sendSms = this._sendSms.bind(this)
      this._checkCode = this._checkCode.bind(this)
    }
  }

  async sendSms(ctx, next) {
    await next()
    const phone = ctx.request.query.phone ?? ''
    ctx.body = await this.realSendSms(phone)
  }

  async checkCode(ctx, next) {
    await next()
    const smscode = ctx.request.query.smscode
    const user = ctx.request.body
    ctx.body = await this.realCheckCode(smscode, user)
  }

  async realSendSms(phone = '') {
    if (this.isDev) {
      return await this.mockSendSms(phone)
    }
    else {
      return await this._sendSms(phone)
    }
  }

  async realCheckCode(smscode = '', user = {}) {
    if (this.isDev) {
      return await this.mockCheckCode(smscode, user)
    }
    else {
      return await this._checkCode(smscode, user)
    }
  }

  // 发送验证码
  async _sendSms(phone = '') {
    // 是否合法手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      log.error('jdck sendSms 手机号格式错误 phone:', phone)
      return {
        code: 400,
        message: '手机号格式错误'
      }
    }

    try {
      log.info('「1」jdck sendSms 手机号:' + phone)
      // sendSms接口中的user参数
      const res = await JDLib.sendSms(phone);
      log.info('「2」jdck sendSms 短信发送:' + res.message)
      return res
    } catch (error) {
      log.error('jdck sendSms error:' + error)
      return {
        code: 400,
        message: '接口异常'
      }
    }
  }

  // 校验验证码&登录
  async _checkCode(smscode = '', user = {}) {
    const regex = /^\d{6}$/;
    if (!regex.test(smscode)) {
      return {
        code: 400,
        message: '验证码格式错误'
      }
    }
    try {
      // sendSms接口中的user参数
      log.info(`「3」jdck checkCode 手机:${user.mobile ?? ''}, smscode:${smscode}`)
      const { mobile, gsalt, guid, lsid } = user
      if (!mobile || !gsalt || !guid || !lsid) {
        log.info('「4」jdck checkCode 短信登录:参数不全')
        return {
          code: 400,
          message: '参数不全, 请联系管理员'
        }
      }

      const ret = await JDLib.checkCode({ ...user, smscode });
      log.info('「4」jdck checkCode 短信登录:' + ret.message)
      console.log('checkCode res:', ret)
      return ret
    } catch (error) {
      log.error('jdck checkCode error:' + error)
      return {
        code: 400,
        message: '接口异常'
      }
    }
  }

  // mock
  async mockSendSms(phone = '') {
    log.info('jdck mock sendSms query.phone:' + phone)

    // 是否合法手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      log.info('jdck mock sendSms message: 手机号格式错误')
      return {
        code: 400,
        message: 'mock 手机号格式错误'
      }
    }

    // const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
    // const fetchData = async () => {
    //   await delay(1);

    //   return {
    //     code: 200,
    //     message: '验证码发送成功',
    //     data: {
    //       mobile: phone,
    //       gsalt: "j3TmuuGcSVwfB2OPrEmlL1J9p1tTDgOW",
    //       guid: "eae890d7268d5e39a652d6f0f0c5f9c0",
    //       lsid: "qHgZ3qAjIofkmGwydoPwU7FnnohktBMU",
    //     }
    //   }
    // };

    // await fetchData();
    return {
      code: 200,
      message: '验证码发送成功',
      data: {
        mobile: phone,
        gsalt: "j3TmuuGcSVwfB2OPrEmlL1J9p1tTDgOW",
        guid: "eae890d7268d5e39a652d6f0f0c5f9c0",
        lsid: "qHgZ3qAjIofkmGwydoPwU7FnnohktBMU",
      }
    }
  }

  async mockCheckCode(smscode = '', user = {}) {
    log.info('jdck mock sendSms query.smscode:' + smscode)

    const regex = /^\d{6}$/;
    if (!regex.test(smscode)) {
      return {
        code: 400,
        message: '验证码格式错误'
      }
    }

    log.info('jdck mock checkCode body:' + JSON.stringify(user))
    const { mobile, gsalt, guid, lsid } = user

    if (!mobile || !gsalt || !guid || !lsid) {
      log.info('jdck mock checkCode message: mock 参数不全')
      return {
        code: 400,
        message: 'mock 参数不全'
      }
    }

    const ck = `pt_key=AAJmcBOmAcsdkguksdkgkgGUIGdddHK23874592KHKOmADDPeB;pt_pin=jd_mock_${mobile};`;
    return {
      code: 200,
      message: 'mock 登录成功',
      data: { ck }
    }
  }
}

module.exports = JDCK