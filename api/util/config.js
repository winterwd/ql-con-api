const fs = require('fs');
const { projectRootDir } = require('./util')

// 读取配置文件
const path = projectRootDir + '/data/config.json'
const config = JSON.parse(fs.readFileSync(path, 'utf-8'));

// 在服务中使用配置参数
console.log('Client ID:', config.client_id);
console.log('Client Secret:', config.client_secret);
console.log('QL_Address:', config.ql_addr);

console.log('wxpusherUid:', config.wxpusher_uid);
console.log('wxpusherAppToken:', config.wxpusher_appToken);
console.log('wxpusherCallbackUrl:', config.wxpusher_callback);

let CONFIG = {
  SITE_NAME: config.site_name ?? "薅豆车",
  QL_ADDR: config.ql_addr ?? "http://127.0.0.1:5700",
  QL_CLIENT_ID: config.client_id ?? "",
  QL_CLIENT_SECRET: config.client_secret ?? "",
  QL_VALID: config.client_id && config.client_secret,
  WXPUSHER_TOKEN: config.wxpusher_appToken ?? "",
  WXPUSHER_URL: config.wxpusher_callback ?? "",
  WXPUSHER_UID: config.wxpusher_uid ?? ""
}

module.exports = CONFIG