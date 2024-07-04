
const QL = require('./ql.js');
const ql = new QL()
const QLToken = require('./ql_token');
const notify = require('../wxpusher/notify.js');
const log = require('../../utils/log_util.js');

function findPt_pin(params = '') {
  // params: pt_key=xxx;pt_pin=xxx
  var pt_pin = ''
  const arr = params.split(';')
  arr.forEach(item => {
    if (item.includes('pt_pin=')) {
      pt_pin = item.split('pt_pin=')[1]
      return
    }
  });
  return pt_pin
}

function findNickname(params = '') {
  // params: nickname@@timestamp@@UID_xxxxx
  return params.split('@@')[0]
}

function findPhone(params = '') {
  // params: nickname@@timestamp@@UID_xxxxx@@phone_xxx

  let phone = undefined
  const arr = params.split('@@')
  arr.forEach(item => {
    if (item.startsWith('phone_')) {
      phone = item.split('phone_')[1]
      return
    }
  });

  return phone
}

function parseJDCKRemarks(params) {
  // params: nickname@@timestamp@@UID_xxxxx@@phone_xxx
  const arr = params.split('@@')
  let nickname = arr[0] ?? '', uid = '', phone = ''
  arr.forEach(item => {
    if (item.startsWith('phone_')) {
      phone = item.split('phone_')[1] ?? ''
    }
    else if (item.startsWith('UID_')) {
      uid = item
    }
  });

  return { uid, phone, nickname }
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
  }

  // 用户更新 uid
  async updateWxPusherUid(data) {
    const { pt_pin, uid } = data ?? {}
    log.info('updateWxPusherUid pt_pin = ' + pt_pin + ', uid = ' + uid)
    const user = await this.getUserJDCKByPin(pt_pin)
    if (user) {
      const nickname = findNickname(user.remarks) ?? pt_pin
      const phone = findPhone(user.remarks) ?? ''
      // remarks: nickname@@timestamp@@UID_xxxxx@@phone_
      user.remarks = `${nickname}@@${Date.now()}@@${uid}@@phone_${phone}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)
        if (res.code == 200) {
          log.info('updateWxPusherUid 更新成功')
          // 更新成功 发送推送给管理员
          this.sendNotify(`用户:${nickname},更新UID啦`, `亲爱的车主，用户：${nickname}，更新了UID：${uid}`)
        }
        else {
          log.error('updateWxPusherUid error = ' + JSON.stringify(res))
        }
        return res
      }
      catch (e) {
        log.error('updateWxPusherUid error = ' + JSON.stringify(e))
        return this.error
      }
    }
    return this.error
  }

  // 用户修改 JD_COOKIE 备注
  async updateRemarks(data) {
    // data：青龙的原始数据
    const { pt_pin, remarks } = data ?? {}
    log.info('updateRemarks pt_pin = ' + pt_pin + ', remarks = ' + remarks)
    const user = await this.getUserJDCKByPin(pt_pin)
    if (user) {
      // remark: nickname@@timestamp@@UID_xxxxx
      const nickname = findNickname(user.remarks)
      log.info('updateRemarks old nickname = ' + (nickname ?? 'null'))
      const uid = findWxPusherUid(user.remarks) ?? ''
      const phone = findPhone(user.remarks) ?? ''
      // remarks: nickname@@timestamp@@UID_xxxxx@@phone_xxx
      user.remarks = `${remarks}@@${Date.now()}@@${uid}@@phone_${phone}`
      try {
        const token = await this.getToken()
        const res = await ql.updateEnvs(token, user)

        if (res.code == 200) {
          log.info('updateRemarks 更新成功')
          // 更新成功 发送推送给管理员
          this.sendNotify(`用户:${nickname},更新备注啦`, `亲爱的车主，用户：${pt_pin}，将备注“${nickname}”修改为：${remarks}`)
        }
        else {
          log.error('updateRemarks error = ' + JSON.stringify(res))
        }
        return res
      } catch (e) {
        log.error('updateRemarks error = ' + JSON.stringify(e))
        return this.error
      }
    }
    else {
      return this.error
    }
  }

  async updateJDCKUserRemarks(data = {}) {
    // data：修改后青龙数据 见：_getJDCKUser
    const { pt_pin, remarks, phone, uid } = data
    const temp = `${remarks}@@${Date.now()}@@${uid}@@phone_${phone}`
    try {
      const token = await this.getToken()
      const res = await ql.updateEnvs(token, {
        id: data.id,
        value: data.value,
        name: 'JD_COOKIE',
        remarks: temp
      })

      if (res.code == 200) {
        log.info('updateJDCKUserRemarks 更新成功')
        // 更新成功 发送推送给管理员
        this.sendNotify(`用户:${pt_pin},更新备注啦`, `亲爱的车主，用户：${pt_pin}，将备注改为：${temp}`)
      }
      else {
        log.error('updateJDCKUserRemarks error = ' + JSON.stringify(res))
      }
      return res
    } catch (e) {
      log.error('updateJDCKUserRemarks error = ' + JSON.stringify(e))
      return this.error
    }
  }

  // 用户提交 CK
  async submitCK(ck = '') {
    // ck: pt_key=xxx;pt_pin=xxx;
    log.info('submitCK ck = ' + ck)
    const arr = ck.split(';')
    if (arr.length < 2) {
      log.error('submitCK arr.length = ' + arr.length)
      return this.error
    }

    // ck
    const pt_key = arr[0].split('pt_key=')[1] ?? ''
    const pt_pin = arr[1].split('pt_pin=')[1] ?? ''
    if (pt_key === '' || pt_pin === '') {
      log.info('submitCK pt_key = ' + pt_key, 'pt_pin = ' + pt_pin)
      return this.error
    }

    const user_value = `pt_key=${pt_key};pt_pin=${pt_pin};`
    const user = await this.getUserJDCKByPin(pt_pin)
    if (user) {
      user.value = user_value
      try {
        const token = await this.getToken()
        let res = await ql.updateEnvs(token, user)

        if (res.code == 200) {
          log.info('submitCK 更新成功')
          // 更新成功 发送推送给管理员
          const nickname = findNickname(user.remarks)
          this.sendNotify(`用户:${nickname},更新CK啦`, `亲爱的车主，用户: “${nickname}” 更新 CK 了`)

          if (String(user.status) === '1') {
            log.info('submitCK status 当前未启用，开始启用...')
            // 若status状态为1，表示被禁用，需启用此变量
            res = await ql.enableEnvs(token, [user.id])
            log.info('submitCK status 启用 ' + (res.code == 200 ? '成功' : '失败'))
          }
        }
        else {
          log.error('submitCK error = ' + JSON.stringify(res))
        }
        return res
      } catch (e) {
        log.error('submitCK error = ' + JSON.stringify(e))
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
        log.info('submitCK 新用户开始提交CK...')
        const token = await this.getToken()
        const res = await ql.insertEnvs(token, jdCKObj)
        if (res.code == 200) {
          log.info('submitCK 新用户提交成功')
          this.sendNotify(`有新用户"${pt_pin}"上车啦`, `亲爱的车主，当前京东车次有新用户: “${pt_pin}” 提交 CK 上车了`)
        }
        else {
          log.error('submitCK 新用户提交 error = ' + JSON.stringify(res))
        }
        return res
      } catch (e) {
        log.error('submitCK error = ' + JSON.stringify(e))
        return this.error
      }
    }
  }

  async parseAndSubmitCK(data = '') {
    const { ck } = this.parsejdck(data)
    log.info('parseAndSubmitCK = ' + ck)
    if (ck) {
      return this.submitCK(ck)
    }
    return this.error
  }

  // 解析 文本中的cookie
  parsejdck(body = {}) {
    log.info('parsejdck body = ' + JSON.stringify(body));
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
        log.info(`解析京东ck完成，pt_key=${pt_key}, pt_pin=${pt_pin}`);
        const ck = `pt_key=${pt_key};pt_pin=${pt_pin};`
        return { pt_key, pt_pin, ck }
      } else {
        log.error(`解析京东ck 失败`);
        return {}
      }
    } else {
      log.error('parsejdck body need to contain pt_key and pt_pin');
      return {}
    }
  }

  // 获取指定用户的 JD_COOKIE 环境变量
  async getUserJDCKByPin(pt_pin = '') {
    log.info('getUserJDCKByPin pt_pin = ' + pt_pin)

    var obj = undefined
    if (pt_pin != '') {
      const cks = await this.getJDCKEnvs()
      for (let i = 0; i < cks.length; i++) {
        const ck = cks[i]
        if (ck.value.includes(pt_pin)) {
          obj = ck
          break
        }
      }
    }

    log.info('getUserJDCKByPin user = ' + (obj ? JSON.stringify(obj) : '没有找到该用户的 JD_COOKIE 环境变量'))
    return obj
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
      log.error('getJDCKEnvs error = ' + JSON.stringify(result))
      return []
    }
  }

  // 获取 ql token
  async getToken() {
    if (!this.qlToken.isExpired()) {
      log.info('qlapi getQLToken token is valid')
      return this.qlToken.token
    }

    log.info('qlapi getQLToken token isExpired, get new token...')
    try {
      const { token, expiration } = await this.loginQL()
      log.info('getQLToken token = ' + token + ', expiration = ' + expiration)
      if (token && expiration) {
        this.qlToken.updateToken({ token, expiration })
        return token
      }
      throw new Error('获取 ql token 失败')
    } catch (e) {
      log.error('getQLToken error = ' + JSON.stringify(e))
      return ''
    }
  }

  async loginQL() {
    log.info('start loginQL')
    try {
      const { data } = await ql.login()
      log.info('loginQL data = ' + JSON.stringify(data))
      return { token: data.token ?? '', expiration: data.expiration ?? 0 }
    } catch (error) {
      log.error('start loginQL error = ' + JSON.stringify(error))
      return this.error
    }
  }

  async getCronTask(id) {
    try {
      const token = await this.getToken()
      if (token) {
        return await ql.getCronTask(token, id)
      }
      return this.error
    } catch (error) {
      log.error('getCronTask error = ' + JSON.stringify(error))
      return this.error
    }
  }

  async searchCronTask(key) {
    try {
      const token = await this.getToken()
      if (token) {
        return await ql.searchCronTask(token, key)
      }
      return this.error
    } catch (error) {
      log.error('getCronTask error = ' + JSON.stringify(error))
      return this.error
    }
  }

  async runCronTask(id) {
    try {
      const token = await this.getToken()
      if (token) {
        return await ql.runCronTask(token, id)
      }
      return this.error
    } catch (error) {
      log.error('runCronTask error = ' + JSON.stringify(error))
      return this.error
    }
  }

  async createCronTask(data) {
    try {
      const token = await this.getToken()
      if (token) {
        return await ql.createCronTask(token, data)
      }
      return this.error
    } catch (error) {
      log.error('createCronTask error = ' + JSON.stringify(error))
      return this.error
    }
  }

  async updateCronTask(data) {
    try {
      const token = await this.getToken()
      if (token) {
        return await ql.updateCronTask(token, data)
      }
      return this.error
    } catch (error) {
      log.error('updateCronTask error = ' + JSON.stringify(error))
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
    const user = await api.getUserJDCKByPin(pt_pin)

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
      ctx.body = { code: 400, message: '获取失败' }
    }
  }

  async submitCK(ctx, next) {
    await next()
    const ck = ctx.request.body.ck ?? ''
    ctx.body = await api.submitCK(ck)
  }

  async _submitCK(ck) {
    if (process.env.npm_lifecycle_event == 'dev') {
      return { code: 200, message: 'mock 登录成功' }
    }
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

  async _wxpusherSendUpCmd(data = {}) {
    const { content, uid } = data
    console.log(`收到 uid:${uid} 发送的指令: ${content}`);
  }

  static async _getJDCKUser() {
    const cks = await api.getJDCKEnvs()
    return cks.map(item => {
      const pt_pin = findPt_pin(item.value)
      const { uid, phone, nickname: remarks } = parseJDCKRemarks(item.remarks)
      return {
        id: item.id,
        pt_pin,
        remarks,
        phone,
        uid: uid ?? '',
        status: item.status,
        value: item.value
      }
    })
  }

  static async _updateJDCKUser(data = {}) {
    return await api.updateJDCKUserRemarks(data)
  }

  static async _createCronTask(data = {}) {
    return await api.createCronTask(data)
  }

  static async _getCronTask(id) {
    return await api.getCronTask(id)
  }

  static async _searchCronTask(key) {
    return await api.searchCronTask(key)
  }

  static async _updateCronTask(data = {}) {
    return await api.updateCronTask(data)
  }

  static async _runCronTask(id) {
    return await api.runCronTask(id)
  }
}

module.exports = QLAPI