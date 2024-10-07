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
      if (response.statusCode != 200) {
        reject({ code: response.statusCode, message: '接口异常' })
      }
      else {
        try {
          const result = JSON.parse(body) ?? { code: 400, message: '接口异常' }
          resolve(result)
        } catch (error) {
          reject({ code: 400, message: error.message })
        }
      }
    })
  })
}

/**
 * 登录青龙面板
 * @return 登录成功后的token
 */
function login() {
  log.info('登录青龙面板接口')

  if (!QL_VALID) {
    return { code: 400, message: ' 请检查client_id 和 请检查client_secret' }
  }

  // 登录url
  let url = ql_addrUrl + "/auth/token";
  let options = {
    url,
    method: 'GET',
    qs: {
      'client_id': client_id,
      'client_secret': client_secret
    }
  }
  return someApiRequest(options);
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
    return { code: 400, message: '获取青龙环境变量失败' }
  }

  // 获取青龙环境变量url
  let url = ql_addrUrl + "/envs?searchValue=" + key;
  // log.info('获取青龙环境变量 url = ' + url)

  let options = requestOptions(url, token)
  options.method = 'GET'
  return someApiRequest(options);
}

/**
 * 添加青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {JSON} [envInfo={name,value,remarks}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function insertEnvs(token = '', envInfo = {}) {
  log.info('添加青龙环境变量 envInfo = ' + JSON.stringify(envInfo))

  if (isEmptyString(token)) {
    return { code: 400, message: '添加青龙环境变量失败' }
  }

  // 添加青龙环境变量url
  let url = ql_addrUrl + "/envs";
  // log.info('添加青龙环境变量 url = ' + url)

  let options = requestOptions(url, token, body = [envInfo])
  options.method = 'POST'
  return someApiRequest(options);
}

/**
 * 更新青龙环境变量
 *
 * @param {string} [token=''] token 登录青龙面板返回的token
 * @param {JSON} [envInfo={name,value,remarks,id}] envInfo 青龙环境变量
 * @return 青龙环境变量
 */
function updateEnvs(token = '', envInfo = {}) {
  log.info('更新青龙环境变量 envInfo = ' + JSON.stringify(envInfo))
  if (isEmptyString(token)) {
    return { code: 400, message: '更新青龙环境变量失败' }
  }
  // 更新青龙环境变量url
  let url = ql_addrUrl + "/envs";
  // log.info('更新青龙环境变量 url = ' + url)

  const body = {
    "name": envInfo.name,
    "value": envInfo.value,
    "remarks": envInfo.remarks,
    "id": envInfo.id
  }

  let options = requestOptions(url, token, body)
  options.method = 'PUT'
  return someApiRequest(options);
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
    return { code: 400, message: '删除青龙环境变量失败' }
  }

  // 删除青龙环境变量url
  let url = ql_addrUrl + "/envs";
  let options = requestOptions(url, token, envIDs)
  options.method = 'DELETE'
  return someApiRequest(options);
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
    return { code: 400, message: '启用青龙环境变量失败' }
  }

  // 启用青龙环境变量url
  let url = ql_addrUrl + "/envs/enable";
  let options = requestOptions(url, token, envIDs)
  options.method = 'PUT'
  return someApiRequest(options);
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
    return { code: 400, message: '禁用青龙环境变量失败' }
  }

  // 禁用青龙环境变量url
  let url = ql_addrUrl + "/envs/disable";
  let options = requestOptions(url, token, envIDs)
  options.method = 'PUT'
  return someApiRequest(options);
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
    return { code: 400, message: '禁用青龙环境变量失败' }
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
    return { code: 400, message: '禁用青龙环境变量失败' }
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
    return { code: 400, message: '禁用青龙环境变量失败' }
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
    return { code: 400, message: '创建定时任务失败' }
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
    return { code: 400, message: '更新定时任务失败' }
  }

  let url = ql_addrUrl + "/crons"
  let options = requestOptions(url, token, body)
  options.method = 'PUT'
  return someApiRequest(options);
}


/**
 * 删除定时任务
 * @param {*} token 
 * @param {*} id 
 */
function deleteCronTask(token = '', id = -1) {
  log.info('删除 定时任务 id = ' + id)
  if (isEmptyString(token)) {
    return { code: 400, message: '删除青龙环境变量失败' }
  }
  if (id == -1) {
    return { code: 400, message: '失败, id 为空' }
  }

  let url = ql_addrUrl + "/crons"
  let options = requestOptions(url, token, body = [id])
  options.method = 'DELETE'
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
    this.deleteCronTask = deleteCronTask
  }
}

module.exports = QL