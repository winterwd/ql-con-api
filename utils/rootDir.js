const fs = require('fs');
const path = require('path');

// 查找项目根目录
function findProjectRootDir(currentDir) {
  const possibleRootDir = currentDir || __dirname;

  if (fs.existsSync(path.join(possibleRootDir, 'package.json'))) {
    return possibleRootDir;
  }

  const parentDir = path.dirname(possibleRootDir);
  if (parentDir === possibleRootDir) {
    throw new Error('Project root directory not found');
  }

  return findProjectRootDir(parentDir);
}

const projectRootDir = findProjectRootDir();
console.log('projectRootDir:', projectRootDir);
module.exports = projectRootDir