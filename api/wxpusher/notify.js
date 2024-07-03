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

function wxpusherNotify(text, desp, wp_uids = WP_UIDS) {
  return new Promise((resolve) => {
    if (WP_APP_TOKEN) {
      let uids = [];
      for (let i of wp_uids.split(";")) {
        if (i.length != 0)
          uids.push(i);
      };
      let topicIds = [];

      let strsummary = text
      if (strsummary.length > 96) {
        strsummary = strsummary.substring(0, 95) + "...";
      }

      // desp = `<font size="3"><b>${text}</b></font>`
      desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
      desp = `<section style="width: 24rem; max-width: 100%;border:none;border-style:none;margin:2.5rem auto;" id="shifu_imi_57"
    donone="shifuMouseDownPayStyle(&#39;shifu_imi_57&#39;)">
    <section
        style="margin: 0px auto;text-align: left;border: 2px solid #212122;padding: 10px 0px;box-sizing:border-box; width: 100%; display:inline-block;"
        class="ipaiban-bc">
        <section style="margin-top: 1rem; float: left; margin-left: 1rem; margin-left: 1rem; font-size: 1.3rem; font-weight: bold;">
            <p style="margin: 0; color: black">
                ${text}
            </p>
        </section>
        <section style="display: block;width: 0;height: 0;clear: both;"></section>
        <section
            style="margin-top:20px; display: inline-block; border-bottom: 1px solid #212122; padding: 4px 20px; box-sizing:border-box;"
            class="ipaiban-bbc">
            <section
                style="width:25px; height:25px; border-radius:50%; background-color:#212122;display:inline-block;line-height: 25px"
                class="ipaiban-bg">
                <p style="text-align:center;font-weight:1000;margin:0">
                    <span style="color: #ffffff;font-size:20px;">📢</span>
                </p>
            </section>
            <section style="display:inline-block;padding-left:10px;vertical-align: top;box-sizing:border-box;">
            </section>
        </section>
        <section style="margin-top:0rem;padding: 0.8rem;box-sizing:border-box;">
            <p style=" line-height: 1.5rem; font-size: 1rem; ">
                ${desp} 
			</p>            
        </section>
    </section>
</section>`;

      const body = {
        appToken: `${WP_APP_TOKEN}`,
        content: `${desp}`,
        summary: `${strsummary}`,
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