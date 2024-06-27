const { execFile } = require('child_process')
const { projectRootDir } = require('../util/util')

/**
 * 执行外部脚本并获取其输出
 * @param {string} scriptPath - 脚本文件路径
 * @param {string[]} [args=[]] - 脚本参数数组
 * @returns {Promise<string>} - 脚本输出
 */
// const executeScript = (scriptPath, args = []) => {
//   return new Promise((resolve, reject) => {
//     const command = `node ${scriptPath} ${args.join(' ')}`;
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(`Error: ${stderr}`);
//       } else {
//         resolve(stdout.trim());
//       }
//     });
//   });
// };
const executeScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    execFile('node', [scriptPath, ...args], (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

class JDCK {
  constructor() {

    if (process.env.npm_lifecycle_event == 'dev') {
      this.sendSms = this.mockSendSms
      this.checkCode = this.mockCheckCode
      console.log('process dev mode')
      return
    }

    this.sendSms = this._sendSms
    this.checkCode = this._checkCode
  }

  // 发送验证码
  async _sendSms(ctx, next) {
    await next()
    const phone = ctx.request.query.phone ?? ''
    console.log('sendSms query.phone:', phone)

    // 是否合法手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      ctx.body = {
        code: 400,
        message: '手机号格式错误'
      }
      console.log('sendSms message: 手机号格式错误')
      return
    }

    try {
      // sendSms接口中的user参数
      const path = projectRootDir + '/api/jdck/sendSms.js'
      var res = await executeScript(path, [`phone=${phone}`]);
      res = JSON.parse(res)
      console.log('sendSms res:', res)
      ctx.body = res
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 400,
        message: '接口异常'
      }
    }
  }

  // 校验验证码&登录
  async _checkCode(ctx, next) {
    await next()
    const smscode = ctx.request.query.smscode
    console.log('checkCode:', smscode)

    const regex = /^\d{6}$/;
    if (!regex.test(smscode)) {
      ctx.body = {
        code: 400,
        message: '验证码格式错误'
      }
      return
    }
    try {
      // sendSms接口中的user参数
      const user = ctx.request.body;
      console.log('checkCode request.body:', user)

      const path = projectRootDir + '/api/jdck/checkCode.js'
      var res = await executeScript(path, [
        `smscode=${smscode}`,
        `phone=${user.mobile ?? ''}`,
        `gsalt=${user.gsalt ?? ''}`,
        `guid=${user.guid ?? ''}`,
        `lsid=${user.lsid ?? ''}`
      ]);
      res = JSON.parse(res)
      console.log('checkCode res:', res)
      ctx.body = res
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 400,
        message: '接口异常'
      }
    }
  }

  // mock
  async mockSendSms(ctx, next) {
    await next()
    const phone = ctx.request.query.phone ?? ''
    console.log('mock sendSms query.phone:', phone)

    // 是否合法手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      ctx.body = {
        code: 400,
        message: 'mock 手机号格式错误'
      }
      console.log('mock sendSms message: 手机号格式错误')
      return
    }

    const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
    const fetchData = async () => {
      await delay(0);

      ctx.body = {
        code: 200,
        message: '验证码发送成功',
        data: {
          mobile: phone,
          gsalt: "j3TmuuGcSVwfB2OPrEmlL1J9p1tTDgOW",
          guid: "eae890d7268d5e39a652d6f0f0c5f9c0",
          lsid: "qHgZ3qAjIofkmGwydoPwU7FnnohktBMU",
        }
      }
    };

    await fetchData();
  }

  async mockCheckCode(ctx, next) {
    await next()
    const smscode = ctx.request.query.smscode ?? ''
    console.log('mock sendSms query.smscode:', smscode)

    const regex = /^\d{6}$/;
    if (!regex.test(smscode)) {
      ctx.body = {
        code: 400,
        message: '验证码格式错误'
      }
      return
    }
    console.log('mock checkCode body:', ctx.request.body)
    const { mobile } = ctx.request.body
    const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
    const fetchData = async () => {
      await delay(0);

      const ck = `pt_key=AAJmcBOmAcsdkguksdkgkgGUIGdddHK23874592KHKOmADDPeB;pt_pin=jd_mock_${mobile};`;
      ctx.body = {
        code: 200,
        message: 'mock 登录成功',
        data: { ck }
      }
    };

    await fetchData();
  }
}

module.exports = JDCK