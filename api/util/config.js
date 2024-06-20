const fs = require('fs');

// 读取配置文件
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

// 在服务中使用配置参数
console.log('Client ID:', config.client_id);
console.log('Client Secret:', config.client_secret);
console.log('QL_Address:', config.ql_addr);

console.log('wxpusherUid:', config.wxpusher_uid);
console.log('wxpusherAppToken:', config.wxpusher_appToken);
console.log('wxpusherCallbackUrl:', config.wxpusher_callback);

let CONFIG = {
  QL_ADDR: config.ql_addr ?? "http://127.0.0.1:5700",
  CLIENT_ID: config.client_id ?? "",
  CLIENT_SECRET: config.client_secret ?? "",
  VALID: config.client_id && config.client_secret,
  WXPUSHER_TOKEN: config.wxpusher_appToken ?? "",
  WXPUSHER_URL: config.wxpusher_callback ?? "",
  WXPUSHER_UID: config.wxpusher_uid ?? ""
}

module.exports = CONFIG