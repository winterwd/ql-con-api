
class User {
  constructor() {
    this.mobile = ''
    this.gsalt = ''
    this.guid = ''
    this.lsid = ''

    this.hasCode = false
    this.ck = ''
  }
}
let user;

document.addEventListener('DOMContentLoaded', DOMContentLoaded)
function DOMContentLoaded(params) {
  // 打开这个页面就清除本地缓存的ck
  // localStorage.removeItem('ck')
  // localStorage.removeItem('ckExpired')
  const mobile = localStorage.getItem("mobile")
  if (mobile) {
    document.getElementById('inputPhone').value = mobile
  }
}

// 获取验证码
function getCode() {
  const phone = document.getElementById('inputPhone').value
  console.log('input phone:', phone)

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    alert('手机号格式错误')
    return
  }

  user = new User()
  console.log('fetch api/sendSms:', phone)

  this.showLoading('smsCodeButton')
  const params = new URLSearchParams({ phone }).toString();
  const url = 'api/jd/sendSms?' + params;

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.code == 200) {
        user.gsalt = res.data.gsalt
        user.guid = res.data.guid
        user.lsid = res.data.lsid
        user.mobile = res.data.mobile
        user.hasCode = true
      }
      alert(res.message)
    })
    .catch(err => console.log(err))
    .finally(() => {
      getCodeFinished()
    })
}

function getCodeFinished() {
  hideLoading('smsCodeButton')
  if (user.hasCode) {
    document.getElementById('inputSmsCode').focus()
    // 验证码获取成功，提示 60 秒后再次获取
    this.reGetCode()
  }
}

// 重新获取验证码
function reGetCode() {
  const button = document.getElementById('smsCodeButton');
  if (!button) return
  button.disabled = true;
  let remainingTime = 60;
  button.textContent = `重新获取 ${remainingTime}s`;

  const countdown = setInterval(function () {
    remainingTime--;
    if (remainingTime > 0) {
      button.textContent = `重新获取 ${remainingTime}s`;
    } else {
      button.disabled = false;
      button.textContent = '获取验证码';
      clearCountdown();
    }
  }, 1000);

  function clearCountdown() {
    console.log('clearCountdown')
    if (countdown) {
      clearInterval(countdown);
    }
  }
  // 页面卸载时清除计时器
  window.addEventListener('beforeunload', clearCountdown);
  // 组件卸载或页面导航时清除计时器
  window.addEventListener('unload', clearCountdown);
}

// 校验验证码
function checkCode() {
  if (!user || !user.hasCode) {
    alert('请先获取验证码')
    return
  }

  const smscode = document.getElementById('inputSmsCode').value
  if (!new RegExp('\\d{6}').test(smscode)) {
    alert('验证码格式不正确')
    return
  }

  console.log('fetch api/checkCode: ', smscode)
  this.showLoading('loginButton')

  const url = 'api/jd/checkCode?smscode=' + smscode
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gsalt: user.gsalt,
      guid: user.guid,
      lsid: user.lsid,
      mobile: user.mobile
    })
  })
    .then(res => res.json())
    .then(res => {
      // console.log('checkCode res:', res)
      let message = res.message
      if (res.code == 200) {
        user.ck = res.data.ck
        message = "恭喜你，上车成功～\n\n关闭免密支付!\n关闭免密支付!\n关闭免密支付!"
      }
      alert(message)
    })
    .catch(err => console.log(err))
    .finally(() => {
      loginFinished()
    })
}

function loginFinished() {
  hideLoading('loginButton')
  if (user.ck) {
    localStorage.setItem('ck', user.ck)
    localStorage.setItem('mobile', user.mobile)
    // 暂定：过期时间为 24 小时
    const ckExpired = Date.now() + 1000 * 60 * 60 * 24
    localStorage.setItem('ckExpired', ckExpired)
    console.log('redirect to /info')
    window.location.href = '/info'
    user = null
  }
}

function showLoading(id = '') {
  const button = document.getElementById(id);
  if (!button) return
  button.disabled = true;
  button.classList.add('loading');
  button.innerHTML = `${button.innerText} <div class="spinner" ></div>`;
}

function hideLoading(id = '') {
  const button = document.getElementById(id);
  if (!button) return
  button.disabled = false;
  button.classList.remove('loading');
  button.innerHTML = button.innerText;
}