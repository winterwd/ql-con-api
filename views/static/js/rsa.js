const crypto = require('crypto');

// 公钥
const publicKey = '-----BEGIN PUBLIC KEY-----\n';

/**
 * 使用 RSA 公钥加密
 * @param {string} text 需要加密的文本
 * @returns {string} Base64 编码的加密字符串
 */
async function encrypt(text) {
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // 使用 OAEP 填充方式
    },
    buffer
  );
  return encrypted.toString('base64'); // 返回 Base64 编码字符串
}

module.exports = encrypt