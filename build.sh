#!/bin/bash

# 颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 默认颜色

# 变量
REPOSITORY="alalakaka"
IMAGE_NAME="jdck"
IMAGE_FULL_NAME="${REPOSITORY}/${IMAGE_NAME}"

IMAGE_TAG=""
VERSION_FILE="version"
# 读取版本文件，如果有内容则用该内容作为 IMAGE_TAG，否则使用 latest
if [[ -s ${VERSION_FILE} ]]; then
  IMAGE_TAG=$(cat ${VERSION_FILE})
  echo -e "${YELLOW}使用版本文件中的标签: ${IMAGE_TAG}${NC}"
else
  IMAGE_TAG="latest"
  echo -e "${YELLOW}版本文件为空或不存在，使用默认标签: ${IMAGE_TAG}${NC}"
fi

# 构建之前先 build 混淆代码
echo -e "${YELLOW}正在构建混淆代码...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}构建混淆代码失败。退出。${NC}"
  exit 1
fi

JS_CODE_PATH='api/jdck/dejdLib.js'
# copy 代码
echo -e "${YELLOW}正在复制代码...${NC}"
cp ./dist/$JS_CODE_PATH ./$JS_CODE_PATH

restoreCode() {
  # 还原代码
  git restore ./$JS_CODE_PATH
}

# 构建镜像
PLATFORMS="linux/amd64,linux/arm64"
echo -e "${YELLOW}正在为 ${PLATFORMS} 构建...${NC}"
docker buildx build --platform ${PLATFORMS} -t ${IMAGE_FULL_NAME}:${IMAGE_TAG} --push .

if [ $? -ne 0 ]; then
  restoreCode
  echo -e "${RED}构建 ${PLATFORMS} 镜像失败。退出。${NC}"
  exit 1
fi

restoreCode
# 创建latest
echo -e "${YELLOW}正在创建 latest ...${NC}"
docker buildx imagetools create -t ${IMAGE_FULL_NAME}:latest ${IMAGE_FULL_NAME}:${IMAGE_TAG}

if [ $? -eq 0 ]; then
  echo -e "${GREEN}成功：${IMAGE_FULL_NAME}:${IMAGE_TAG}${NC}"
else
  echo -e "${RED}失败。退出。${NC}"
  exit 1
fi
