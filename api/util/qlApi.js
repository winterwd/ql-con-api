
const QL = require('./ql.js');
const ql = new QL()
const QLToken = require('./ql_token');
const notify = require('../wxpusher/notify.js');

function findNickname(params = '') {
  // params: nickname@@timestamp@@UID_xxxxx
  return params.split('@@')[0]
}

function findWxPusherUid(params = '') {
  // params: nickname@@timestamp@@UID_xxxxx
  let uid = undefined
  const arr = params.split('@@')
  arr.forEach(item => {
    if (item.startsWith('UID_')) {
      uid = item
    }
  });

  return uid
}

class Api {
  constructor() {
    this.qlToken = QLToken.getToken();
    this.sendNotify = notify.wxpusherNotify
    this.error = { code: 400, message: '操作失败' }

    console.log('qlapi token = ', this.qlToken)
  }

  // 用户更新 uid
  async updateWxPusherUid(data) {
    const { pt_pin, uid } = data ?? {}
    console.log('updateWxPusherUid pt_pin = ' + pt_pin + ', uid = ' + uid)
    const user = await this.getUserJDCK(pt_pin)
    if (user) {
      const nickname = findNickname(user.remarks) ?? pt_pin
      // remarks: nickname@@timestamp@@UID_xxxxx
      user.remarks = `${nickname}@@${Date.now()}@@${uid}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)
        if (res.code == 200) {
          // 更新成功 发送推送给管理员
          this.sendNotify('有用户更新 Uid 啦', `亲爱的车主，当前京东车次用户：${nickname}，更新了Uid：${uid}`)
        }
        return res
      }
      catch (e) {
        return this.error
      }
    }
    return this.error
  }

  // 用户修改 JD_COOKIE 备注
  async updateRemarks(data) {
    const { pt_pin, remarks } = data ?? {}
    console.log('updateRemarks pt_pin = ' + pt_pin + ', remarks = ' + remarks)
    const user = await this.getUserJDCK(pt_pin)
    if (user) {
      // remark: nickname@@timestamp@@UID_xxxxx
      const nickname = findNickname(user.remarks)
      console.log('old nickname = ' + nickname ?? 'null')
      const uid = findWxPusherUid(user.remarks) ?? ''
      user.remarks = `${remarks}@@${Date.now()}@@${uid}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)

        if (res.code == 200) {
          // 更新成功 发送推送给管理员
          this.sendNotify('有用户更新备注啦', `亲爱的车主，当前京东车次用户：${pt_pin}，将备注“${nickname}”修改为：${remarks}`)
        }
        return res
      } catch (e) {
        return this.error
      }
    }
    else {
      return this.error
    }
  }

  // 用户提交 CK
  async submitCK(ck = '') {
    // ck: pt_key=xxx;pt_pin=xxx;
    const arr = ck.split(';')
    if (arr.length < 2) {
      return this.error
    }

    // ck
    const pt_key = arr[0].split('pt_key=')[1] ?? ''
    const pt_pin = arr[1].split('pt_pin=')[1] ?? ''
    if (pt_key === '' || pt_pin === '') {
      return this.error
    }

    const user_value = `pt_key=${pt_key};pt_pin=${pt_pin};`
    const user = await this.getUserJDCK(pt_pin)
    if (user) {
      user.value = user_value
      try {
        const token = await this.getToken()
        let res = await ql.updateEnvs(token, user)

        if (res.code == 200) {
          // 更新成功 发送推送给管理员
          const nickname = findNickname(user.remarks)
          this.sendNotify('有老用户更新CK啦', `亲爱的车主，当前京东车次有老用户: “${nickname}”更新 CK 了`)

          if (String(user.status) === '1') {
            // 若status状态为1，表示被禁用，需启用此变量
            res = await ql.enableEnvs(token, [user.id])
          }
        }
        return res
      } catch (e) {
        return this.error
      }
    }
    else {
      // 新用户
      try {
        const jdCKObj = {
          name: 'JD_COOKIE',
          remarks: pt_pin,
          value: user_value,
        }
        const token = await this.getToken()
        const res = await ql.insertEnvs(token, jdCKObj)
        if (res.code == 200) {
          this.sendNotify('有新用户上车啦', `亲爱的车主，当前京东车次有新用户: “${pt_pin}” 提交 CK 上车了`)
        }
        return res
      } catch (e) {
        return this.error
      }
    }
  }

  async parseAndSubmitCK(data = '') {
    const { ck } = this.parsejdck(data)
    console.log('parseAndSubmitCK = ' + ck)
    if (ck) {
      return this.submitCK(ck)
    }
    return this.error
  }

  // 解析 文本中的cookie
  parsejdck(body = {}) {
    console.log('parsejdck body = ' + body)
    const ck = body.ck ?? ''
    // ck 中是否包含 pt_key 和 pt_pin
    if (ck.includes('pt_key') && ck.includes('pt_pin')) {
      let pt_key = ''
      let pt_pin = ''

      // 将 ck 拆分为字符串数组，找出 pt_key 和 pt_pin
      let temp = ck.split(';')
      temp.forEach(s => {
        if (s.includes('pt_key=')) {
          pt_key = s.split('pt_key=')[1]
        }
        else if (s.includes('pt_pin=')) {
          pt_pin = s.split('pt_pin=')[1]
        }
      });

      // 是否存在 pt_key 和 pt_pin
      if (pt_key && pt_pin) {
        console.log(`解析京东ck完成，pt_key=${pt_key}, pt_pin=${pt_pin}`);
        const ck = `pt_key=${pt_key};pt_pin=${pt_pin};`
        return { pt_key, pt_pin, ck }
      } else {
        console.log(`解析京东ck 失败`);
        return {}
      }
    } else {
      console.log('parsejdck body need to contain pt_key and pt_pin');
      return {}
    }
  }

  // 获取指定用户的 JD_COOKIE 环境变量
  async getUserJDCK(pt_pin = '') {
    if (pt_pin === '') {
      return undefined
    }
    const cks = await this.getJDCKEnvs()
    for (let i = 0; i < cks.length; i++) {
      const ck = cks[i]
      if (ck.value.includes(pt_pin)) {
        return ck
      }
    }
    return undefined
  }

  // 获取 ql CK 环境变量
  async getJDCKEnvs() {
    try {
      const token = await this.getToken()
      if (token) {
        const { data } = await ql.getEnvs(token, 'JD_COOKIE')
        return data
      }
      return []
    } catch (result) {
      console.log('getJDCKEnvs error = ' + JSON.stringify(result))
      return []
    }
  }

  // 获取 ql token
  async getToken() {
    if (!this.qlToken.isExpired()) {
      console.log('qlapi getQLToken token is valid')
      return this.qlToken.token
    }
    console.log('qlapi getQLToken token isExpired')
    try {
      const { token, expiration } = await this.loginQL()
      if (token && expiration) {
        this.qlToken.updateToken({ token, expiration })
        return token
      }
      throw new Error('获取 ql token 失败')
    } catch (e) {
      return ''
    }
  }

  async loginQL() {
    console.log('start loginQL')
    try {
      const { data } = await ql.login()
      console.log('loginQL data = ' + JSON.stringify(data))
      return { token: data.token ?? '', expiration: data.expiration ?? 0 }
    } catch (error) {
      console.log('start loginQL error = ' + JSON.stringify(error))
      return this.error
    }
  }
}

const api = new Api()
class QLAPI {
  // constructor() {
  //   api = new Api();
  // }

  async parseAndSubmitCK(ctx, next) {
    await next()
    const data = ctx.request.body ?? {}
    ctx.body = await api.parseAndSubmitCK(data)
  }

  async getJDCK(ctx, next) {
    await next()
    const pt_pin = ctx.request.query.pt_pin
    const user = await api.getUserJDCK(pt_pin)

    if (user) {
      const remarks = findNickname(user.remarks)
      const uid = findWxPusherUid(user.remarks)
      const data = {
        pt_pin,
        remarks,
        uid: uid ?? '',
        id: user.id,
        status: user.status
      }
      ctx.body = { code: 200, message: '获取成功', data }
    }
    else {
      ctx.body = {code: 400, message: '获取失败'}
    }
  }

  async submitCK(ctx, next) {
    await next()
    const ck = ctx.request.body.ck ?? ''
    ctx.body = await api.submitCK(ck)
  }

  async _submitCK(ck) {
    return await api.submitCK(ck)
  }

  async updateRemarks(ctx, next) {
    await next()
    const { pt_pin, remarks } = ctx.request.body
    ctx.body = await api.updateRemarks({ pt_pin, remarks })
  }

  async updateWxPusherUid(ctx, next) {
    await next()
    const { pt_pin, uid } = ctx.request.body
    ctx.body = await api.updateWxPusherUid({ pt_pin, uid })
  }

  async _updateWxPusherUid(data) {
    return await api.updateWxPusherUid(data)
  }
}

module.exports = QLAPI