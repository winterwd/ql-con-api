const jdLib = require('./jdLib.js');

const args = process.argv.splice(1)

!(async () => {
  let phone = "";
  args.forEach(element => {
    if (element.includes('phone=')) {
      phone = element.split("phone=")[1];
    }
  });

  const user = await jdLib.init();
  user.mobile = phone;
  // const res = await sendSms(user);
  const res = { err_code: 0, err_msg: '验证码发送成功' }

  const code = res.err_code == 0 ? 200 : 400
  let ret = {
    code: code,
    data: code === 200 ? user : {},
    message: code === 200 ? res.err_msg : '验证码发送成功'
  }
  console.log(JSON.stringify(ret))
})()
  .catch((e) => {
    console.log(JSON.stringify({ code: 400, message: `❌失败! 原因: ${e}!` }))
  })
  .finally(() => {
    process.exit()
  })


async function sendSms(data) {
  const res = await jdLib.getVeriCode(data);
  return res;
}
