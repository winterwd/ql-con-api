
const jdLib = require('./jdLib.js');

const args = process.argv.splice(2)

!(async () => {
  let phone = "", gsalt = "", guid = "", lsid = "", smscode = "";
  args.forEach(element => {
    if (element.includes('phone=')) {
      phone = element.split("phone=")[1];
    } else if (element.includes('gsalt=')) {
      gsalt = element.split("gsalt=")[1];
    } else if (element.includes('guid=')) {
      guid = element.split("guid=")[1];
    } else if (element.includes('lsid=')) {
      lsid = element.split("lsid=")[1];
    } else if (element.includes('code=')) {
      smscode = element.split("code=")[1];
    }
  });

  const data = {
    gsalt: gsalt,
    guid: guid,
    lsid: lsid,
    mobile: phone,
    smscode: smscode,
  }

  const res = await checkCode(data);
  let code = 400, ret = {}, message = res.err_msg ?? '登录失败'
  if (res.err_code == 0) {
    code = 200
    message = '登录成功'
    const cookie =
      'pt_key=' +
      res.data.pt_key +
      ';pt_pin=' +
      encodeURIComponent(res.data.pt_pin) +
      ';';
    ret = { ck: cookie }
  }

  const body = {
    code: code,
    data: ret,
    message: message
  }
  console.log(JSON.stringify(body));
})()
  .catch((e) => {
    console.log(JSON.stringify({ code: 400, message: `❌失败! 原因: ${e}!` }))
  })
  .finally(() => {
    process.exit()
  })

async function checkCode(data) {
  const res = await jdLib.doTelLogin(data);
  return res;
}
