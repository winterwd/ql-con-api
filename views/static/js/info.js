
class UserInfo {
  constructor() {
    this.pt_pin = ''
    this.remarks = ''
    this.uid = ''
    this.id = 0
    this.status = 1
  }
}
let userInfo = undefined;

document.addEventListener('DOMContentLoaded', DOMContentLoaded)
function DOMContentLoaded(params) {
  // 获取 localStorage 中的 ck
  const ck = localStorage.getItem("ck");
  const ckExpired = localStorage.getItem("ckExpired");
  if (!ck || !ckExpired || ckExpired < Date.now()) {
    // 没有数据或者过期
    window.location.href = "/home";
    return
  }

  const ckData = formatCKData(ck);
  fetchViewLabelData(ckData.pt_pin);
}

function fetchViewLabelData(pt_pin='') {
  showLoading('titleBar', false)
  const url = 'api/ql/jdck?pt_pin=' + pt_pin;
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.code == 200) {
        const data = res.data
        updateViewLabelData(data)
      }
      else {
        console.log(res.message)
        alert(res.message)
      }
    })
    .finally(res => {
      hideLoading('titleBar')
    })
}

function updateViewLabelData(data) {
  document.getElementById("info-container").style.display = "block";
  const {
    pt_pin,
    remarks,
    uid,
    id,
    status
  } = data
  
  userInfo = new UserInfo()
  userInfo.pt_pin = pt_pin
  userInfo.remarks = remarks
  userInfo.uid = uid
  userInfo.id = id
  userInfo.status = status

  const pt_pin_text = pt_pin
  const remark_text = remarks
  let notify_text = "暂未绑定微信推送"

  let openWxPusherTxt = "绑定微信"
  if (uid) {
    notify_text = uid
    openWxPusherTxt = "修改绑定"
  }

  document.getElementById("ptpinLabel").innerText = pt_pin_text
  document.getElementById("remarkLabel").innerText = remark_text
  document.getElementById("notifyLabel").innerText = notify_text
  document.getElementById("openWxPusher").innerText = openWxPusherTxt
}

function openRemarkModal() {
  document.getElementById("remarkModal").style.display = "block";
  document.getElementById("remarkInput").focus()
}

function closeRemarkModal() {
  document.getElementById("remarkModal").style.display = "none";
  document.getElementById("remarkInput").value = ''
}

function saveRemark() {
  const remark = document.getElementById("remarkInput").value;
  saveUserRemark(remark);
}

function saveUserRemark(remark='') {
  const url = 'api/ql/remarks';
  const data = {
    "pt_pin": userInfo.pt_pin,
    "remarks": remark
  }

  showLoading('saveRemark')
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(res => {
      if (res.code == 200) {
        alert("备注已更新");
      }
      else {
        console.log(res.message)
        alert(res.message)
      }
    })
    .finally(res => {
      hideLoading('saveRemark')
      closeRemarkModal()
      fetchViewLabelData(userInfo.pt_pin)
    })
}

function openWxPusherQRCode() {
  showLoading('openWxPusher')
  fetchWxPusherData()
}

function closeNotifyModal() {
  document.getElementById("notifyModal").style.display = "none";
}

// Close modals when clicking outside of them
window.onclick = function (event) {
  if (event.target == document.getElementById("remarkModal")) {
    closeRemarkModal();
  }
  if (event.target == document.getElementById("notifyModal")) {
    closeNotifyModal();
  }
}

function fetchWxPusherData() {
  const url = 'api/wxpusher/qrcode?extra=' + userInfo.pt_pin;
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.code == 200) {
        const data = res.data
        updateWxPusherData(data)
      }
      else {
        console.log(res.message)
        alert(res.message)
      }
    })
    .finally(res => {
      hideLoading('openWxPusher')
    })
}

function updateWxPusherData(data) {
  const {url} = data
  document.getElementById("WxPusherQRCode").src = url
  document.getElementById("notifyModal").style.display = "block";;
}

function bindWxPusherQRCode() {
  fetchViewLabelData(userInfo.pt_pin)
  closeNotifyModal()
}

function formatCKData(ck = '') {
  // ck: "pt_key=xxx;pt_pin=xxx;"
  function maskString(str) {
    if (str.length <= 20) {
      return str;
    }

    let start = str.slice(0, 10);
    let end = str.slice(-10);
    return start + '***' + end;
  }

  //取出 pt_key 和 pt_pin
  const temp = ck.split(';');
  const pt_key = temp[0].split('=')[1];
  const pt_pin = temp[1].split('=')[1];
  const maskCK = `pt_key=${maskString(pt_key)};pt_pin=${pt_pin};`;

  return {
    pt_key,
    pt_pin,
    maskCK
  }
}

function showLoading(id = '', disabled = true) {
  const element = document.getElementById(id);
  if (!element) return
  element.disabled = disabled;
  element.classList.add('loading');
  element.innerHTML = `${element.innerText} <div class="spinner" ></div>`;
}

function hideLoading(id = '', disabled = false) {
  const element = document.getElementById(id);
  if (!element) return
  element.disabled = disabled;
  element.classList.remove('loading');
  element.innerHTML = element.innerText;
}