const fs = require('fs');

// 读取配置文件
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

// 在服务中使用配置参数
console.log('Client ID:', config.client_id);
console.log('Client Secret:', config.client_secret);
console.log('QL_Address:', config.ql_addr);
console.log('wxpusherCallbackUrl:', config.wxpusher);

let QL_CONFIG = {
  QL_ADDR: config.ql_addr??"http://127.0.0.1:5700",
  CLIENT_ID: config.client_id??"",
  CLIENT_SECRET: config.client_secret??"",
  VALID: config.client_id&&config.client_secret
}

module.exports = QL_CONFIG