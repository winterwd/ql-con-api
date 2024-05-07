const request = require('request');

/**
 * 判断字符串是否为空
 * @param {string} [str=''] str 字符串
 * @return 是否为空
 */
function isEmptyString(str) {
  return str.trim().length === 0;
}

function requestOptions(url, token, body) {
  return {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}

/**
 * 登录青龙面板
 *
 * @param {string} [client_id=''] client_id 青龙面板应用id
 * @param {string} [client_secret=''] client_secret 青龙面板应用密钥
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @return 登录成功后的token
 */
function login(client_id = '', client_secret = '', ql_addr = 'http://127.0.0.1:5700') {
  console.log('登录青龙面板接口')

  let code = 400
  let token = '登录青龙面板'

  if (isEmptyString(client_id)) {
    return { code, message: token + ' 请检查client_id' }
  }

  if (isEmptyString(client_secret)) {
    return { code, message: token + ' 请检查client_secret' }
  }

  if (isEmptyString(ql_addr)) {
    return { code, message: token + ' 请检查ql_addr' }
  }

  // 登录url
  let ql_addrUrl = ql_addr;
  let loginUrl = ql_addrUrl + "/open/auth/token";
  console.log('loginUrl = ' + loginUrl)

  return new Promise((resolve, reject) => {
    request.get({
      url: loginUrl,
      qs: {
        'client_id': client_id,
        'client_secret': client_secret
      }
    }, function (error, response, body) {
      if (error !== null) {
        reject(error)
        return
      }

      let result = JSON.parse(body)
      console.log('loginUrl result = ' + body)
      if (result.code == 200) {
        token = result.data.token
        code = 200
      } else {
        code = result.code
        message = result.message
      }

      if (code == 200) {
        resolve({ code, data: token, message: '登录成功' })
      }
      else {
        reject(result)
      }
    })
  })
}

/**
 * 获取青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [key=''] key 青龙环境变量
 * @return 青龙环境变量
 */
function getEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', key = '') {
  console.log('获取青龙环境变量 key = ' + key)

  if (isEmptyString(token)) {
    return { code: 401, message: '获取青龙环境变量失败, token 为空' }
  }

  // 获取青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs?searchValue=" + key;
  console.log('获取青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.get(requestOptions(qlEnvsUrl, token),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('获取青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '获取青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 添加青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [envInfo={name,value,remarks}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function insertEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', envInfo = {}) {
  console.log('添加青龙环境变量 envInfo = ' + JSON.stringify(envInfo))

  if (isEmptyString(token)) {
    return { code: 401, message: '添加青龙环境变量失败, token 为空' }
  }

  // 添加青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs";
  console.log('添加青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.post(requestOptions(qlEnvsUrl, token, body = [envInfo]),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('添加青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '添加青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 更新青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [envInfo={name,value,remarks, id}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function updateEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', envInfo = {}) {
  console.log('更新青龙环境变量 envInfo = ' + JSON.stringify(envInfo))
  if (isEmptyString(token)) {
    return { code: 401, message: '更新青龙环境变量失败, token 为空' }
  }
  // 更新青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs";
  console.log('更新青龙环境变量 url = ' + qlEnvsUrl)

  const data = {
    "name": envInfo.name,
    "value": envInfo.value,
    "remarks": envInfo.remarks,
    "id": envInfo.id
  }
  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlEnvsUrl, token, body = data),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('更新青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '更新青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 删除青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function deleteEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', envIDs = []) {
  console.log('删除青龙环境变量接口 evnIDs = ' + JSON.stringify(envIDs))
  if (isEmptyString(token)) {
    return { code: 401, message: '删除青龙环境变量失败, token 为空' }
  }

  // 删除青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs";
  console.log('删除青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.delete(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('删除青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '删除青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 启用青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function enableEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', envIDs = []) {
  console.log('启用青龙环境变量接口 evnIDs = ' + JSON.stringify(envIDs))
  if (isEmptyString(token)) {
    return { code: 401, message: '启用青龙环境变量失败, token 为空' }
  }

  // 启用青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs/enable";
  console.log('启用青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('启用青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, message: '启用青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 禁用青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function disableEnvs(token = '', ql_addr = 'http://127.0.0.1:5700', envIDs = []) {
  console.log('禁用青龙环境变量接口')
  if (isEmptyString(token)) {
    return { code: 401, message: '禁用青龙环境变量失败, token 为空' }
  }

  // 禁用青龙环境变量url
  let ql_addrUrl = ql_addr;
  let qlEnvsUrl = ql_addrUrl + "/open/envs/disable";
  console.log('禁用青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('禁用青龙环境变量 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '禁用青龙环境变量成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 获取 脚本文件
 * get:/scripts/{file} 这个接口不知道怎么用，先不用了，改用 download
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [fileName=''] fileName 脚本文件
 * @return 脚本文件
 */
function getScriptFile(token = '', ql_addr = 'http://127.0.0.1:5700', fileName = '') {
  console.log('获取脚本文件接口')
  if (isEmptyString(token)) {
    return { code: 401, message: '获取脚本文件失败, token 为空' }
  }

  if (isEmptyString(fileName)) {
    return { code: 404, message: '获取脚本文件失败, fileName 为空' }
  }

  // 获取脚本文件url
  let ql_addrUrl = ql_addr;
  let qlScriptFileUrl = ql_addrUrl + "open/scripts/download";
  console.log('获取脚本文件 url = ' + qlScriptFileUrl)

  return new Promise((resolve, reject) => {
    request.post(requestOptions(qlScriptFileUrl, token, body = { "filename": fileName }),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('获取脚本文件 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, data: result.data, message: '获取脚本文件成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 更新脚本文件
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [fileName=''] fileName 脚本文件，可以是路径：xxx/filename
 * @param {string} [fileContent=''] fileContent 脚本文件内容
 * @return 脚本文件
 */
function updateScriptFile(token = '', ql_addr = 'http://127.0.0.1:5700', fileName = '', fileContent = '') {
  console.log('更新脚本文件接口')
  if (isEmptyString(token)) {
    return { code: 401, message: '更新脚本文件失败, token 为空' }
  }
  if (isEmptyString(fileName)) {
    return { code: 404, message: '更新脚本文件失败, fileName 为空' }
  }
  if (isEmptyString(fileContent)) {
    return { code: 400, message: '更新脚本文件失败, fileContent 为空' }
  }

  // 更新脚本文件url
  let ql_addrUrl = ql_addr;
  let qlScriptFileUrl = ql_addrUrl + "open/scripts";
  console.log('更新脚本文件 url = ' + qlScriptFileUrl)

  let data = {
    "filename": fileName,
    "path": "",
    "content": fileContent.toString()
  }

  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlScriptFileUrl, token, body = data),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        console.log('更新脚本文件 result = ' + body)
        const result = JSON.parse(body)
        if (result.code == 200) {
          resolve({ code: result.code, message: '更新脚本文件成功' })
        } else {
          reject(result)
        }
      })
  })
}

/**
 * 获取微信推送配置
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @return 微信推送配置
 */
function getWxPusherUidConfig(token = '', ql_addr = 'http://127.0.0.1:5700') {
  console.log('获取微信推送配置接口')
  if (isEmptyString(token)) {
    return { code: 401, message: '获取微信推送配置失败, token 为空' }
  }

  // 获取微信推送配置url
  return getScriptFile(token, ql_addr, 'CK_WxPusherUid.json')
}

/**
 * 更新微信推送配置
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [ql_addr='http://127.0.0.1:5700'] ql_addr 青龙面板地址
 * @param {string} [json={Uid,pt_pin}] json 微信推送配置
 * @return 更新微信推送配置
 */
function updateWxPusherUidConfig(token = '', ql_addr = 'http://127.0.0.1:5700', json = {}) {
  console.log('更新微信推送配置接口')
  if (isEmptyString(token)) {
    return { code: 401, message: '更新微信推送配置失败, token 为空' }
  }
  // 判断json是否合法
  if (isEmptyString(json.Uid) || isEmptyString(json.pt_pin)) {
    return { code: 400, message: '更新微信推送配置失败, json格式不正确:{Uid:xxx,pt_pin:xxx}' }
  }

  try {
    const result = getWxPusherUidConfig(token, ql_addr)

    if (result.code == 200) {
      let fileContent = result.data
      let fileContentJson = JSON.parse(fileContent)
      // [{Uid:Uid,pt_pin:pt_pin}]
      // 以 Uid 为准，更新
      // 查找是否存在 Uid
      let index = fileContentJson.findIndex(item => item.Uid == json.Uid)
      if (index == -1) {
        // 不存在，插入
        console.log('不存在，插入')
        fileContentJson.push(json)
      } else {
        // 存在，更新
        console.log('存在，更新')
        fileContentJson[index] = json
      }

      return updateScriptFile(token, ql_addr, 'CK_WxPusherUid.json', JSON.stringify(fileContentJson))
    }

    return result
  } catch (error) {
    console.log('更新微信推送配置失败 ' + error)
    return { code: 400, message: '更新微信推送配置失败' }
  }
}

module.exports = {
  login,
  getEnvs,
  insertEnvs,
  updateEnvs,
  deleteEnvs,
  enableEnvs,
  disableEnvs,
  getScriptFile,
  updateScriptFile,
  getWxPusherUidConfig,
  updateWxPusherUidConfig
};
