# ql-con-api
qinglong data update

version=1.0
docker buildx build --platform linux/amd64,linux/arm64 -t alalakaka/jdck:$version --push . 
docker buildx imagetools create -t alalakaka/jdck:$version alalakaka/jdck:latest