# 使用官方 Node.js 基础镜像
FROM node:18-alpine

# 创建 app 目录来持有应用
WORKDIR /jdck

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN echo 'Asia/Shanghai' > /etc/timezone

# 将项目代码复制到容器中
COPY . .
RUN npm install --only=production

# 你的应用绑定的端口，确保与你的 app 监听的端口一致
EXPOSE 8864

# 告诉 Docker 启动容器时运行什么命令
CMD ["node", "index.js"]