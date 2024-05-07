# 使用官方 Node.js 基础镜像，选择一个适合 ARM 架构的版本，例如 node:14-alpine
# Alpine Linux 版本较小，适合轻量级容器环境
FROM arm32v7/node:14-alpine

# 创建 app 目录来持有应用
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 将本地的 config.json 文件拷贝到镜像中的 /app 目录
COPY config.json .

# 安装 app 依赖
# 使用 --only=production 来只安装生产环境的依赖，如果项目不需要分开管理依赖则可以忽略该参数
RUN npm install

# 将项目代码复制到容器中
COPY . .

# 你的应用绑定的端口，确保与你的 app 监听的端口一致
EXPOSE 8970

# 告诉 Docker 启动容器时运行什么命令
CMD [ "node", "index.js" ]