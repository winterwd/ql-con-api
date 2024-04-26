// 第三方请求

const request = require('request')

/** url参数转换 */
const obj2String = (obj, arr = [], idx = 0) => {
  for (let item in obj) {
    arr[idx++] = [item, obj[item]]
  }
  return new URLSearchParams(arr).toString()
}

/** 第三方接口 调用 */
const requestApi = (method = 'get', url, params = null) => {
  return new Promise((resolve, reject) => {
    if (method === 'get') {
      if (params) {
        url += '?' + obj2String(params)
      }
      request.get(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          reject(error)
        }
      })
    } else {
      const option = {
        url: url,
        method: 'post',
        json: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'content-type': 'application/json'
        },
        body: params
      }
      request(option, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          reject(error)
        }
      })
    }
  })
}

module.exports = requestApi
