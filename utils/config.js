const fs = require('fs');
const YAML = require('yaml');
const rootDir = require('./rootDir')

// 读取配置文件
const path = rootDir + '/data/config.yml';
const config = YAML.parse(fs.readFileSync(path, 'utf-8'));
const version = fs.readFileSync(rootDir + '/version', 'utf-8');

const { site, qinglong, wxpusher, wxpusher_bot } = config;
site.version = version;

console.log(`============ 欢迎使用 JDCK（${version}）===================`);
console.log('site: ' + JSON.stringify(site, null, 2));
console.log('qinglong: ' + JSON.stringify(qinglong, null, 2));
console.log('wxpusher: ' + JSON.stringify(wxpusher, null, 2));
console.log('wxpusher_bot: ' + JSON.stringify(config.wxpusher_bot, null, 2));
console.log('=======================================================');

module.exports = { site, qinglong, wxpusher, wxpusher_bot }