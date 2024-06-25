
class User {
  constructor() {
    this.mobile = ''
    this.gsalt = ''
    this.guid = ''
    this.lsid = ''

    this.hasCode = false
    this.ck = ''
    this.submitSuccess = false
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
  // console.log('input phone:', phone)

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    alert('手机号格式错误')
    return
  }

  user = new User()
  // console.log('fetch api/sendSms:', phone)

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
    .catch(err => // console.log(err))
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
let countdown;
function reGetCode() {
  const button = document.getElementById('smsCodeButton');
  if (!button) return
  button.disabled = true;
  let remainingTime = 60;
  button.textContent = `重新获取 ${remainingTime}s`;

  countdown = setInterval(function () {
    remainingTime--;
    if (remainingTime > 0) {
      button.textContent = `重新获取 ${remainingTime}s`;
    } else {
      clearCountdown();
    }
  }, 1000);

  // 页面卸载时清除计时器
  window.addEventListener('beforeunload', clearCountdown);
  // 组件卸载或页面导航时清除计时器
  window.addEventListener('unload', clearCountdown);
}

function clearCountdown() {
  // console.log('clearCountdown')
  if (countdown) {
    clearInterval(countdown);
    countdown = 0;
  }

  const button = document.getElementById('smsCodeButton');
  if (!button) return
  button.disabled = false;
  button.textContent = '获取验证码';
}

// 校验验证码
function checkCode() {
  if (!user || !user.hasCode) {
    alert('请先获取验证码')
    return
  }

  const smscode = document.getElementById('inputSmsCode').value
  const regex = /^\d{6}$/;
  if (!regex.test(smscode)) {
    alert('验证码格式不正确')
    return
  }

  // console.log('fetch api/checkCode: ', smscode)
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
      user.ck = res.data.ck ?? ''
      let message = res.message
      if (res.code == 200) {
        user.submitSuccess = true
        message = "恭喜你，上车成功～\n\n关闭免密支付!\n关闭免密支付!\n关闭免密支付!"
      }
      alert(message)
    })
    .catch(err => // console.log(err))
    .finally(() => {
      loginFinished()
    })
}

function loginFinished() {
  hideLoading('loginButton')
  clearCountdown()
  clearInputSmsCode()

  // console.log('loginFinished user.ck:', user.ck, "user.submitSuccess:", user.submitSuccess)
  if (user.ck) {
    if (user.submitSuccess) {
      // 登录成功并提交成功
      submitSuccess()
    }
    else {
      // 登录成功但未提交成功
      document.getElementById('retryButton').style.display = 'block'
    }
  }
}

function retrySubmit() {
  document.getElementById('smsCodeButton').disabled = true
  document.getElementById('loginButton').disabled = true

  showLoading('retryButton')
  const ck = user.ck
  const url = 'api/ql/jdck_set'
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ck })
  })
    .then(res => res.json())
    .then(res => {
      alert(res.message)
      if (res.code == 200) {
        user.submitSuccess = true
      }
    })
    .catch(err => // console.log(err))
    .finally(() => {
      hideLoading('retryButton')
      document.getElementById('smsCodeButton').disabled = false
      document.getElementById('loginButton').disabled = false
      loginFinished()
    })
}

function submitSuccess() {
  localStorage.setItem('ck', user.ck)
  localStorage.setItem('mobile', user.mobile)
  // 暂定：过期时间为 24 小时
  const ckExpired = Date.now() + 1000 * 60 * 60 * 24
  localStorage.setItem('ckExpired', ckExpired)

  // console.log('redirect to /info')
  window.location.href = '/info'
  user = null
}

function clearInputSmsCode() {
  document.getElementById('inputSmsCode').value = ''
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