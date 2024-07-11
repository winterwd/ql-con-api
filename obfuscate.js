#!/usr/bin/env node

const fs = require('fs-extra');
const obfuscator = require('javascript-obfuscator');
const path = require('path');


let obfuscateConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.75,
  debugProtection: false,
  debugProtectionInterval: 1000,
  disableConsoleOutput: true,
  identifierNamesGenerator: "hexadecimal",
  log: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 1.0,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}

const [, , srcPath, outDir = 'dist', configPath, ...additionalExclusions] = process.argv;

// 默认排除的目录或文件
const exclusions = ['node_modules', 'dist', 'obfuscate.js', ...additionalExclusions];

if (configPath && fs.existsSync(configPath)) {
  try {
    obfuscateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (typeof obfuscateConfig.debugProtectionInterval !== 'number' || obfuscateConfig.debugProtectionInterval < 0) {
      obfuscateConfig.debugProtectionInterval = 1000;
    }
  } catch (error) {
    console.error(`Error: Invalid config file "${configPath}".`);
    process.exit(1);
  }
}

fs.ensureDirSync(outDir);

const getFiles = (dir, excludePatterns) => {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);

    // 检查是否排除
    const shouldExclude = excludePatterns.some(pattern => fullPath.includes(pattern));
    if (shouldExclude) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath, excludePatterns));
    } else if (fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  return files;
};

// 调用 getFiles 时传递排除模式
const files = getFiles(srcPath, exclusions);

files.forEach(file => {
  const input = fs.readFileSync(file, 'utf8');
  const obfuscatedCode = obfuscator.obfuscate(input, obfuscateConfig).getObfuscatedCode();

  const relativePath = path.relative(srcPath, file);
  const outputFilePath = path.join(outDir, relativePath);
  fs.ensureDirSync(path.dirname(outputFilePath));
  fs.writeFileSync(outputFilePath, obfuscatedCode);
  console.log(`Obfuscated: ${file} => ${outputFilePath}`);
});

console.log('Obfuscation completed.');
