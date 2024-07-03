const request = require('request');
const { wxpusher } = require('../../utils/config');

let WP_APP_TOKEN = "";
let WP_TOPICIDS = "";
let WP_UIDS = "";
let WP_URL = "";
let timeout = 15000;

// 读取配置文件
WP_APP_TOKEN = wxpusher.appToken;
WP_UIDS = wxpusher.uid;

function wxpusherNotify(text, desp) {
  return new Promise((resolve) => {
    if (WP_APP_TOKEN) {
      let uids = [];
      for (let i of WP_UIDS.split(";")) {
        if (i.length != 0)
          uids.push(i);
      };
      let topicIds = [];
      for (let i of WP_TOPICIDS.split(";")) {
        if (i.length != 0)
          topicIds.push(i);
      };
      desp = `<font size="4"><b>${text}</b></font>\n\n<font size="3">${desp}</font>`;
      desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
      const body = {
        appToken: `${WP_APP_TOKEN}`,
        content: `${desp}`,
        summary: `${text}`,
        contentType: 2,
        topicIds: topicIds,
        uids: uids,
        url: `${WP_URL}`,
      };
      const options = {
        url: `http://wxpusher.zjiecode.com/api/send/message`,
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      };
      request.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log("WxPusher 发送通知调用 API 失败！！\n");
            console.log("WxPusher Error: ", err);
          } else {
            data = JSON.parse(data);
            if (data.code === 1000) {
              console.log("WxPusher 发送通知消息成功!\n");
            }
          }
        } catch (e) {
          console.log("WxPusher Error: ", e);
        }
        finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function wxpusherTextNotify(text, desp) {
  return wxpusherNotify(text, desp);
}

module.exports = { wxpusherNotify }