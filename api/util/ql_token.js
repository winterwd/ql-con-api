const fs = require('fs');

class QLToken {
  constructor(tokenData) {
    this.token = tokenData.token;
    this.expiration = new Date(tokenData.expiration);
  }

  isExpired() {
    // 检查是否过期 提前 60 分钟过期
    return new Date(new Date().getTime() + 60 * 60 * 1000) >= this.expiration;
  }

  static getToken() {
    return this.fromFile('ql_token.json')
  }

  static fromFile(filePath, url = 'http://127.0.0.1:5700') {
    try {
      const tokens = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
    return this.updateTokenToFile('ql_token.json', newToken)
  }

  static updateTokenToFile(filePath, newTokenData = {}, url = 'http://127.0.0.1:5700') {
    try {
      let tokens = {};
      if (fs.existsSync(filePath)) {
        tokens = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
const qlToken = QLToken.getToken();
if (qlToken) {
  console.log('Token:', qlToken.token);
  console.log('Expiration:', qlToken.expiration);
  console.log('Is expired:', qlToken.isExpired());
}

// 更新 token 到本地文件
const newTokenData = {
  token: 'new_token_value',
  expiration: '2024-12-31T23:59:59Z'
};
QLToken.saveNewToken(newTokenData);

export default QLToken
