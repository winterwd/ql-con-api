// const jdLib = require('./jdLib.js');

// class JDCK {
//   constructor() {

//     if (process.env.npm_lifecycle_event == 'dev') {
//       this.sendSms = this.mockSendSms
//       this.checkCode = this.mockCheckCode

//       return
//     }

//     this.sendSms = this._sendSms
//     this.checkCode = this._checkCode
//   }

//   // 发送验证码
//   async _sendSms(ctx, next) {
//     await next()
//     const phone = ctx.request.query.phone ?? ''
//     console.log('sendSms query.phone:', phone)

//     // 是否合法手机号正则
//     const phoneRegex = /^1[3-9]\d{9}$/;
//     if (!phoneRegex.test(phone)) {
//       ctx.body = {
//         code: 400,
//         message: '手机号格式错误'
//       }
//       console.log('sendSms message: 手机号格式错误')
//       return
//     }

//     try {
//       const user = await jdLib.init()
//       user.mobile = phone
//       const res = await jdLib.getVeriCode(user)
//       console.log('getVeriCode res:', res)

//       const code = res.err_code == 0 ? 200 : 400
//       ctx.body = {
//         code: code,
//         data: user,
//         message: res.err_msg || '验证码发送成功'
//       }
//     } catch (error) {
//       console.log(error);
//       ctx.body = {
//         code: 400,
//         message: '接口异常'
//       }
//     }
//   }

//   // 校验验证码&登录
//   async _checkCode(ctx, next) {
//     await next()
//     const smscode = ctx.request.query.smscode
//     console.log('checkCode:', smscode)

//     const regex = /^\d{6}$/;
//     if (!regex.test(smscode)) {
//       ctx.body = {
//         code: 400,
//         message: '验证码格式错误'
//       }
//       return
//     }
//     try {
//       // sendSms接口中的user参数
//       const user = ctx.request.body;
//       console.log('checkCode request.body:', user)
//       const res = await jdLib.doTelLogin({
//         gsalt: user.gsalt,
//         guid: user.guid,
//         lsid: user.lsid,
//         mobile: user.mobile,
//         smscode: smscode,
//       });
//       console.log('checkCode doTelLogin res:', res)

//       let code = 400, data = {}, message = '登录失败:' + res.err_msg
//       if (res.err_code == 0) {
//         code = 200
//         const cookie =
//           'pt_key=' +
//           res.data.pt_key +
//           ';pt_pin=' +
//           encodeURIComponent(res.data.pt_pin) +
//           ';';
//         console.log('cookie', cookie);
//         data = { ck: cookie }
//       }

//       ctx.body = {
//         code: code,
//         data: data,
//         message: message
//       }
//     } catch (error) {
//       console.log(error);
//       ctx.body = {
//         code: 400,
//         message: '接口异常'
//       }
//     }
//   }

//   // mock
//   async mockSendSms(ctx, next) {
//     await next()
//     const phone = ctx.request.query.phone ?? ''
//     console.log('mock sendSms query.phone:', phone)

//     // 是否合法手机号正则
//     const phoneRegex = /^1[3-9]\d{9}$/;
//     if (!phoneRegex.test(phone)) {
//       ctx.body = {
//         code: 400,
//         message: 'mock 手机号格式错误'
//       }
//       console.log('mock sendSms message: 手机号格式错误')
//       return
//     }

//     const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
//     const fetchData = async () => {
//       await delay(2);

//       ctx.body = {
//         code: 200,
//         message: '验证码发送成功',
//         data: {
//           mobile: phone,
//           gsalt: "j3TmuuGcSVwfB2OPrEmlL1J9p1tTDgOW",
//           guid: "eae890d7268d5e39a652d6f0f0c5f9c0",
//           lsid: "qHgZ3qAjIofkmGwydoPwU7FnnohktBMU",
//         }
//       }
//     };

//     await fetchData();
//   }

//   async mockCheckCode(ctx, next) {
//     await next()
//     const smscode = ctx.request.query.smscode ?? ''
//     console.log('mock sendSms query.smscode:', smscode)

//     const regex = /^\d{6}$/;
//     if (!regex.test(smscode)) {
//       ctx.body = {
//         code: 400,
//         message: '验证码格式错误'
//       }
//       return
//     }
//     console.log('mock checkCode body:', ctx.request.body)
//     const { mobile } = ctx.request.body
//     const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
//     const fetchData = async () => {
//       await delay(2);

//       const ck = `pt_key=AAJmcBOmAcsdkguksdkgkgGUIGdddHK23874592KHKOmADDPeB;pt_pin=jd_mock_${mobile};`;
//       ctx.body = {
//         code: 200,
//         message: 'mock 登录成功',
//         data: { ck }
//       }
//     };

//     await fetchData();
//   }
// }

// module.exports = JDCK