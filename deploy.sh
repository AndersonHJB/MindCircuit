#! /usr/bin/env sh
set -e

git pull
git status
git add .
git commit -m "update" || echo "No changes to commit"
git push -u origin main

#m -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build

cd dist
echo "已成功进入目录打包...正在进行打包"
mkdir -p ../zip
zip -r ../zip/dist.zip ./
echo "已经成功打包"

echo "***** 上传中 *****"
scp -v -i ~/.ssh/id_rsa -r ../zip/dist.zip root@121.89.218.11:/www/wwwroot/ai.bornforthis.cn/MindCircuit
echo "***** 成功上传 *****"
rm -rf ../zip/dist.zip
echo "***** 进入服务器，触发远端程序 *****"
# ssh root@121.89.218.11 "sh /bash/autounzip.sh"
ssh -i ~/.ssh/id_rsa root@121.89.218.11 "sh /www/wwwroot/bash/MindCircuit.sh"
echo "***** 传输完毕*****"


npm run dev
