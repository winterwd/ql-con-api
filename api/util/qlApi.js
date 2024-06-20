
const QL = require('./ql.js');
const ql = new QL()
const QLToken = require('./ql_token');
const notify = require('../wxpusher/notify.js');

function findNickname(params = '') {
  // params: nickname@@timestamp@@Uid_xxxxx
  return params.split('@@')[0]
}

function findWxPusherUid(params = '') {
  // params: nickname@@timestamp@@Uid_xxxxx
  let uid = undefined
  const arr = params.split('@@')
  arr.forEach(item => {
    if (item.startsWith('Uid_')) {
      uid = item
    }
  });

  return uid
}

class QLApi {
  constructor() {
    this.qlToken = QLToken.getToken();
    this.sendNotify = notify.wxpusherNotify
    this.error = { code: 400, message: '操作失败' }
  }

  // 用户更新 uid
  async updateWxPusherUid(pt_pin, uid) {
    const user = await this.getUserJDCK(pt_pin)
    if (user) {
      const nickname = findNickname(user.remarks)??pt_pin
      // remarks: nickname@@timestamp@@Uid_xxxxx
      user.remarks = `${nickname}@@${Date.getTime()}@@${uid}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)
        if (res.code == 200) {
          // 更新成功 发送推送给管理员
          this.sendNotify('有用户更新UID啦', `亲爱的车主，当前京东车次用户：${nickname}，更新了Uid：${uid}`)
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
  async updateJDCKRemark(pt_pin, remarks) {
    const user = await this.getUserJDCK(pt_pin)
    if (user) {
      // remark: nickname@@timestamp@@Uid_xxxxx
      const nickname = findNickname(user.remarks)
      console.log('old nickname = ' + nickname??'null')
      const uid = findWxPusherUid(user.remarks)??''
      user.remarks = `${remarks}@@${Date.getTime()}@@${uid}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)

        if (res.code == 200) {
          // 更新成功 发送推送给管理员
          this.sendNotify('有用户更新备注啦', `亲爱的车主，当前京东车次用户：${pt_pin}，将备注“${nickname}”修改为：${remarks}`)
        }
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
    const pt_key = arr[0].split('pt_key=')[1]??''
    const pt_pin = arr[1].split('pt_pin=')[1]??''
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
            res = await ql.updateEnvs(token, [user.id])
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

  // 获取指定用户的 JD_COOKIE 环境变量
  async getUserJDCK(pt_pin = '') {
    const cks = await this.getJDCKEnvs()
    for (let i = 0; i < cks.length; i++) {
      const ck = cks[i]
      if (ck.value.includes(pt_pin)) {
        return ck
      }
    }
    return null
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
    if (!this.qlToken.isExpired) {
      return this.qlToken.token
    }

    try {
      const { token, expiration } = await this.loginQL()
      if (token && expiration) {
        this.qlToken.updateToken({ token, expiration })
        return token
      }
    } catch (e) {
      return ''
    }
  }

  async loginQL() {
    try {
      const { code, data } = await ql.login()
      console.log('getQLToken code = ' + code + ', token = ' + data.token)
      return { token: data.token, expiration: data.expiration }
    } catch (result) {
      console.log('getQLToken error = ' + JSON.stringify(result))
      const error = result
      return error;
    }
  }
}

module.exports = QLApi