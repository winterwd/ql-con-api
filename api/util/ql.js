const request = require('request');
const { qinglong } = require('../../utils/config');
const log = require('../../utils/log_util');

const ql_addr = qinglong.ql_addr ?? "http://127.0.0.1:5700"
const ql_addrUrl = ql_addr + "/open";
const client_id = qinglong.client_id ?? ""
const client_secret = qinglong.client_secret ?? ""
const QL_VALID = qinglong.client_id && qinglong.client_secret

/**
 * 判断字符串是否为空
 * @param {string} [str=''] str 字符串
 * @return 是否为空
 */
function isEmptyString(str = '') {
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

const someApiRequest = async (options = {}) => {
  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        reject(error)
      }
      else {
        const result = JSON.parse(body) ?? {}
        resolve(result)
      }
    });
  })
}

/**
 * 登录青龙面板
 * @return 登录成功后的token
 */
function login() {
  log.info('登录青龙面板接口')

  let code = 400

  if (!QL_VALID) {
    return { code, message: ' 请检查client_id 和 请检查client_secret' }
  }

  // 登录url
  let loginUrl = ql_addrUrl + "/auth/token";
  // log.info('loginUrl = ' + loginUrl)

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
      if (result.code == 200) {
        resolve({ ...result, message: '登录成功' })
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
 * @param {string} [key=''] key 青龙环境变量
 * @return 青龙环境变量
 */
function getEnvs(token = '', key = '') {
  log.info('获取青龙环境变量 searchValue = ' + key)

  if (isEmptyString(token)) {
    return { code: 401, message: '获取青龙环境变量失败, token 为空' }
  }

  // 获取青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs?searchValue=" + key;
  // log.info('获取青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.get(requestOptions(qlEnvsUrl, token),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        // log.info('获取青龙环境变量 result = ' + body)
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
 * @param {string} [envInfo={name,value,remarks}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function insertEnvs(token = '', envInfo = {}) {
  log.info('添加青龙环境变量 envInfo = ' + JSON.stringify(envInfo))

  if (isEmptyString(token)) {
    return { code: 401, message: '添加青龙环境变量失败, token 为空' }
  }

  // 添加青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs";
  // log.info('添加青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.post(requestOptions(qlEnvsUrl, token, body = [envInfo]),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        // log.info('添加青龙环境变量 result = ' + body)
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
 * @param {string} [envInfo={name,value,remarks,id}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function updateEnvs(token = '', envInfo = {}) {
  log.info('更新青龙环境变量 envInfo = ' + JSON.stringify(envInfo))
  if (isEmptyString(token)) {
    return { code: 401, message: '更新青龙环境变量失败, token 为空' }
  }
  // 更新青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs";
  // log.info('更新青龙环境变量 url = ' + qlEnvsUrl)

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

        // log.info('更新青龙环境变量 result = ' + body)
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
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function deleteEnvs(token = '', envIDs = []) {
  log.info('删除青龙环境变量接口 evnIDs = ' + JSON.stringify(envIDs))
  if (isEmptyString(token)) {
    return { code: 401, message: '删除青龙环境变量失败, token 为空' }
  }

  // 删除青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs";
  // log.info('删除青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.delete(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        // log.info('删除青龙环境变量 result = ' + body)
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
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function enableEnvs(token = '', envIDs = []) {
  log.info('启用青龙环境变量接口 evnIDs = ' + JSON.stringify(envIDs))
  if (isEmptyString(token)) {
    return { code: 401, message: '启用青龙环境变量失败, token 为空' }
  }

  // 启用青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs/enable";
  // log.info('启用青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        // log.info('启用青龙环境变量 result = ' + body)
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
 * @param {string} [envIDs=[]] envIDs 青龙环境变量id
 * @return 青龙环境变量
 */
function disableEnvs(token = '', envIDs = []) {
  log.info('禁用青龙环境变量接口 evnIDs = ' + JSON.stringify(envIDs))
  if (isEmptyString(token)) {
    return { code: 401, message: '禁用青龙环境变量失败, token 为空' }
  }

  // 禁用青龙环境变量url
  let qlEnvsUrl = ql_addrUrl + "/envs/disable";
  // log.info('禁用青龙环境变量 url = ' + qlEnvsUrl)

  return new Promise((resolve, reject) => {
    request.put(requestOptions(qlEnvsUrl, token, body = envIDs),
      function (error, response, body) {
        if (error !== null) {
          reject(error)
          return
        }

        // log.info('禁用青龙环境变量 result = ' + body)
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
 * 获取 定时任务
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {number} [id] id 定时任务id
 * @return 定时任务
 */
function getCronTask(token = '', id = -1) {
  log.info('获取 定时任务 id = ' + id)
  if (isEmptyString(token)) {
    return { code: 401, message: '禁用青龙环境变量失败, token 为空' }
  }
  if (id == -1) {
    return { code: 400, message: '失败, id 为空' }
  }

  let url = ql_addrUrl + "/crons/" + id
  let options = requestOptions(url, token)
  options.method = 'GET'
  return someApiRequest(options);
}

/**
 * 搜索 定时任务
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {string} [key] key 定时任务 key
 * @return 定时任务
 */
function searchCronTask(token = '', key = '') {
  log.info('搜索 定时任务 key = ' + key)
  if (isEmptyString(token)) {
    return { code: 401, message: '禁用青龙环境变量失败, token 为空' }
  }
  if (!key) {
    return { code: 400, message: '失败, key 为空' }
  }

  let url = ql_addrUrl + "/crons?searchValue=" + key
  let options = requestOptions(url, token)
  options.method = 'GET'
  return someApiRequest(options);
}

/**
 * 运行 定时任务
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {number} [id] id 定时任务id
 * @return 定时任务
 */
function runCronTask(token = '', id = -1) {
  log.info('运行 定时任务 id = ' + id)
  if (isEmptyString(token)) {
    return { code: 401, message: '禁用青龙环境变量失败, token 为空' }
  }
  if (id == -1) {
    return { code: 400, message: '失败, id 为空' }
  }

  let url = ql_addrUrl + "/crons/run"
  let options = requestOptions(url, token, body = [id])
  options.method = 'PUT'
  return someApiRequest(options);
}

/**
 * 创建定时任务
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {JSON} [body={name, schedule, command}] body 定时任务
 * @return 定时任务
 */
function createCronTask(token = '', body = {}) {
  log.info('创建定时任务 body = ' + JSON.stringify(body))
  if (isEmptyString(token)) {
    return { code: 401, message: '创建定时任务失败, token 为空' }
  }
  let url = ql_addrUrl + "/crons"
  let options = requestOptions(url, token, body)
  options.method = 'POST'
  return someApiRequest(options);
}

/**
 * 更新定时任务
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {JSON} [body={id, schedule, command}] body 定时任务
 * @return 定时任务
 */
function updateCronTask(token = '', body = {}) {
  log.info('更新定时任务 body = ' + JSON.stringify(body))
  if (isEmptyString(token)) {
    return { code: 401, message: '更新定时任务失败, token 为空' }
  }

  let url = ql_addrUrl + "/crons"
  let options = requestOptions(url, token, body)
  options.method = 'PUT'
  return someApiRequest(options);
}

class QL {
  constructor() {
    this.login = login
    this.getEnvs = getEnvs
    this.insertEnvs = insertEnvs
    this.updateEnvs = updateEnvs
    this.deleteEnvs = deleteEnvs
    this.enableEnvs = enableEnvs
    this.disableEnvs = disableEnvs
    this.getCronTask = getCronTask
    this.runCronTask = runCronTask
    this.searchCronTask = searchCronTask
    this.createCronTask = createCronTask
    this.updateCronTask = updateCronTask
  }
}

module.exports = QL