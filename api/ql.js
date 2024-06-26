
const router = require('koa-router')()
const ql = require('./util/qlutil')
const fs = require('fs');

// 读取配置文件
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

// 在服务中使用配置参数
console.log('Client ID:', config.client_id);
console.log('Client Secret:', config.client_secret);
console.log('QL_Address:', config.ql_addr);

let QL_CONFIG = {
  "QL_ADDR": config.ql_addr,
  "CLIENT_ID": config.client_id,
  "CLIENT_SECRET": config.client_secret
}

/** 路由模块配置  (前缀) */
router.prefix('/ql/v1')

/**
 * 解析 文本中京东ck（值来自于手机alook浏览器提取）
 * @param {string} [ck=''] ck 京东cookie
 */
router.post('/parse_jdck', async (ctx, next) => {
  await next()
  const { ck } = ctx.request.body;
  // 检查参数是否存在且为字符串类型
  if (typeof ck === 'string') {
    const jdck = parsejdck(ctx.request.body)
    const { pt_key, pt_pin } = jdck
    if (pt_pin != null && pt_key != null) {
      ctx.body = {
        code: 200,
        data: { pt_key, pt_pin },
        message: '解析京东ck完成',
      }
    }
    else {
      ctx.body = {
        code: 400,
        message: 'Parameter ck is invalid, need to contain pt_key and pt_pin',
      }
    }
  } else {
    let message = 'body parameter ck is required and must be a string'
    ctx.body = {
      code: 400,
      message: message
    };
    console.log(message);
  }
})

/**
 * 解析 文本中京东ck
 */
function parsejdck(body = {}) {
  const { ck } = body;
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
      return { pt_key, pt_pin }
    } else {
      console.log(`解析京东ck 失败`);
      return {}
    }
  } else {
    console.log('parsejdck body need to contain pt_key and pt_pin');
    return {}
  }
}

/**
 * 用pt_key和pt_pin更新京东ck
 * @param {string} [ck={pt_key: '', pt_pin: ''}] ck 京东cookie中的 pt_key 和 pt_pin
 * @param {string?} [client_id=''] qinglong 面板应用id
 * @param {string?} [client_secret=''] qinglong 面板应用密钥
 * @param {string?} [ql_addr='http://127.0.0.1:5700'] qinglong 面板地址
 */
router.post('/update_jdck', async (ctx, next) => {
  await next()
  const { ck = {}, ql_addr = '', client_id = '', client_secret = '' } = ctx.request.body;
  if (ql_addr) {
    QL_CONFIG.QL_ADDR = ql_addr
  }
  if (client_id) {
    QL_CONFIG.CLIENT_ID = client_id
  }
  if (client_secret) {
    QL_CONFIG.CLIENT_SECRET = client_secret
  }

  const { pt_key, pt_pin } = ck
  const { code, message } = await doUpdateJDCK({ pt_key, pt_pin })
  ctx.body = { code, message }
})

/**
 * 使用 cookie 来更新京东ck
 * 1：先解析京东ck
 * 2：再更新ql的环境变量
 * @param {string} [ck=''] ck 京东cookie
 * @param {string?} [client_id=''] qinglong 面板应用id
 * @param {string?} [client_secret=''] qinglong 面板应用密钥
 * @param {string?} [ql_addr='http://127.0.0.1:5700'] qinglong 面板地址
 */
router.post('/update/jdck', async (ctx, next) => {
  await next()
  const { ck } = ctx.request.body;
  // 检查参数是否存在且为字符串类型
  if (typeof ck === 'string') {
    const jdck = parsejdck(ctx.request.body)
    const { pt_key, pt_pin } = jdck
    const { client_id = '', client_secret = '', ql_addr = '' } = ctx.request.body
    
    if (ql_addr) {
      QL_CONFIG.QL_ADDR = ql_addr
    }
    if (client_id) {
      QL_CONFIG.CLIENT_ID = client_id
    }
    if (client_secret) {
      QL_CONFIG.CLIENT_SECRET = client_secret
    }

    const { code, message } = await doUpdateJDCK({ pt_key, pt_pin })
    ctx.body = {
      code,
      message
    }
  } else {
    let message = 'body parameter ck is required and must be a string'
    ctx.body = {
      code: 400,
      message: message
    };
    console.log(message);
  }
})

/**
 * 更新青龙环境变量
 * @param {{}} [params={}] params
 * @return 处理后的青龙环境变量
 */
async function doUpdateJDCK(params) {
  const { pt_key, pt_pin } = params
  if (!(pt_key && pt_pin)) {
    return { code: 400, message: 'Parameter ck is invalid, need to contain pt_key and pt_pin' }
  }

  // 获取 ql token
  const { code, token, message } = await getQLToken()
  if (code == 200) {
    // 获取 ql 环境变量
    const { code, data, message } = await getQLEvns({ token })
    if (code == 200) {
      // 更新 ql 环境变量
      const { code, message } = await handleQLEnvs(token, data, { pt_key, pt_pin })
      return { code, message }
    }
    else {
      return { code, message }
    }
  }
  else {
    return { code, message }
  }
}

/**
 * 获取青龙token
 * @return 青龙token
 */
async function getQLToken() {
  const client_id = QL_CONFIG.CLIENT_ID
  const client_secret = QL_CONFIG.CLIENT_SECRET
  const QL_ADDR = QL_CONFIG.QL_ADDR

  try {
    const { code, data, message } = await ql.login(client_id, client_secret, QL_ADDR)
    console.log('getQLToken ' + 'code = ' + code + ', token = ' + data + ', message = ' + message)
    return { code, token: data, message }
  } catch (result) {
    console.log('getQLToken error = ' + JSON.stringify(result))
    const error = result
    return error;
  }
}

/**
 * 获取青龙环境变量
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @return 青龙环境变量
 */
async function getQLEvns(params) {
  const { token } = params
  try {
    const { code, data, message } = await ql.getEnvs(token, QL_CONFIG.QL_ADDR)
    console.log('getQLEvns ' + 'code = ' + code + ', message = ' + message)
    return { code, data, message }
  } catch (error) {
    return error;
  }
}

/**
 * 处理青龙环境变量
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {[]} [envs=[{}]] envs 青龙环境变量
 * @param {{}} [jdck={}] jdck 京东ck
 * @return 处理后的青龙环境变量
 */
async function handleQLEnvs(token, envs = [], jdck = {}) {
  console.log('handleQLEnvs count = ' + envs.length)
  console.log('handleQLEnvs jdck = ' + JSON.stringify(jdck))

  const { pt_key, pt_pin } = jdck

  // 找出 JD_COOKIE
  let jdCKObj = {}
  for (let i = 0; i < envs.length; i++) {
    const obj = envs[i]
    if (obj.name === 'JD_COOKIE') {
      if (String(obj.value).includes(pt_pin)) {
        // JD_COOKIE 包含 对应的 pt_pin，则更新
        jdCKObj = obj
        break
      }
    }
  }
  console.log('handleQLEnvs find jdCKObj = ' + JSON.stringify(jdCKObj))

  let value = "pt_key=" + pt_key + ";pt_pin=" + pt_pin + ";"
  if (Object.keys(jdCKObj).length !== 0) {
    // 找到，更新
    jdCKObj.value = value
    try {
      const { code, message } = await ql.updateEnvs(token, QL_CONFIG.QL_ADDR, jdCKObj)
      console.log('handleQLEnvs updateEnvs ' + 'code = ' + code + ', message = ' + message)

      if (String(jdCKObj.status) === '1') {
        // 若status状态为1，表示被禁用，需启用此变量
        console.log('handleQLEnvs pt_pin = ' + pt_pin + ' 未启用')
        const { code, message } = await ql.enableEnvs(token, QL_CONFIG.QL_ADDR, [jdCKObj.id])
        console.log('handleQLEnvs enableEnvs ' + 'code = ' + code + ', message = ' + message)
        return { code, message }
      }
      return { code, message }
    } catch (error) {
      return error
    }
  }
  else {
    // 没找到，新增
    jdCKObj = {
      name: 'JD_COOKIE',
      remarks: pt_pin,
      value: value,
    }
    try {
      const { code, message, data } = await ql.insertEnvs(token, QL_CONFIG.QL_ADDR, jdCKObj)
      console.log('handleQLEnvs insertEnvs ' + 'code = ' + code + ', message = ' + message)
      return { code, data, message }
    } catch (error) {
      return error;
    }
  }
}

module.exports = router
