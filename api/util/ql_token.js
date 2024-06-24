const { projectRootDir } = require('./util')
const fs = require('fs');
const staticPath = '/data/ql_token.json'
const TokenJsonPath = projectRootDir + staticPath

class QLToken {
  constructor(tokenData) {
    this.token = tokenData.token;
    this.expiration = tokenData.expiration;
    console.log('constructor QLToken:', this.token, "expiration:", this.expiration)
  }

  isExpired() {
    const current = parseInt(new Date().getTime() / 1000)
    console.log('QLToken current:', current, 'expiration:', this.expiration)
    // 检查是否过期 提前 60 分钟过期
    return (current + 60 * 60) >= this.expiration;
  }

  updateToken(obj = {}) {
    const { token, expiration } = obj
    console.log('updateToken:', token, expiration)
    if (token == undefined || expiration == undefined) {
      return
    }
    this.token = token
    this.expiration = expiration
    QLToken.saveNewToken(obj)
  }

  static getToken() {
    return this.fromFile(TokenJsonPath)
  }

  static fromFile(filePath, url = 'http://127.0.0.1:5700') {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}');
      }
      let text = fs.readFileSync(filePath, 'utf-8');
      console.log('fromFile text = ', text)
      if (!text) {
        text = '{}';
      }
      const tokens = JSON.parse(text) ?? {};
      let tokenData = tokens[url];
      if (!tokenData) {
        tokenData = {
          token: '',
          expiration: 0
        }
      }
      return new QLToken(tokenData);
    } catch (error) {
      console.error('Error reading token file:', error);
      return null;
    }
  }

  static saveNewToken(newToken) {
    console.log('saveNewToken newToken = ', newToken)
    return this.updateTokenToFile(TokenJsonPath, newToken)
  }

  static updateTokenToFile(filePath, newTokenData = {}, url = 'http://127.0.0.1:5700') {
    try {
      let tokens = {};
      if (fs.existsSync(filePath)) {
        let text = fs.readFileSync(filePath, 'utf-8');
        console.log('updateTokenToFile text = ', text)
        if (!text) {
          text = '{}';
        }
        tokens = JSON.parse(text);
      }
      tokens[url] = newTokenData;
      fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2));
      console.log('Token file updated successfully.');
      return true;
    } catch (error) {
      console.error('Error updating token file:', error);
      return false;
    }
  }
}

// 示例用法
// const qlToken = QLToken.getToken();
// if (qlToken) {
//   console.log('qlToken Token:', qlToken.token);
//   console.log('qlToken Expiration:', qlToken.expiration);
//   console.log('qlToken Is expired:', qlToken.isExpired());
// }

// // 更新 token 到本地文件
// const newTokenData = {
//   token: 'new_token_value',
//   expiration: '2024-12-31T23:59:59Z'
// };
// QLToken.saveNewToken(newTokenData);

module.exports = QLToken
