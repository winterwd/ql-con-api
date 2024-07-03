const fs = require('fs');
const YAML = require('yaml');
const rootDir = require('./rootDir')

// 读取配置文件
const path = rootDir + '/data/config.yaml'
const config = YAML.parse(fs.readFileSync(path, 'utf-8'));

const { site, qinglong, wxpusher, wxpusher_bot } = config

console.log('\n============欢迎使用 JDCK（薅豆车）===================');
console.log(JSON.stringify(config, null, 2));
console.log('===================================================\n');

module.exports = { site, qinglong, wxpusher, wxpusher_bot }