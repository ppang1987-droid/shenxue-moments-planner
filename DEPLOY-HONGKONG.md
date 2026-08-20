# 申学朋友圈规划台：香港服务器部署步骤

目标架构：香港轻量服务器作为中国大陆访问入口，Vercel 保留为备用站。

## 一、购买服务器

推荐选择腾讯云轻量应用服务器：

- 地域：中国香港
- 系统：Ubuntu 24.04 LTS
- 配置：2 核 2GB 起
- 公网带宽：5Mbps 起
- 系统盘：40GB 起

购买后记录“公网 IPv4 地址”。登录密码不要发送到聊天中，优先使用腾讯云控制台登录或 SSH 密钥。

## 二、开放端口

在服务器详情页的“防火墙”中确认以下 TCP 端口已放行：

- 22：服务器登录
- 80：网页与 HTTPS 证书验证
- 443：HTTPS 正式访问

不要开放 3000 端口，网站应用只在服务器内部通信。

## 三、首次登录服务器

在腾讯云控制台点击“登录”，选择免密登录；或者在电脑终端使用：

```bash
ssh root@服务器公网IP
```

## 四、下载项目并安装运行环境

```bash
git clone https://github.com/ppang1987-droid/shenxue-moments-planner.git
cd shenxue-moments-planner
sudo bash deploy/bootstrap-ubuntu.sh
```

安装结束后，如当前账号不是 root，退出服务器再重新登录一次。

## 五、配置网站地址和 API

```bash
cp .env.production.example .env.production
nano .env.production
```

只有 IP 时先填写：

```text
SITE_ADDRESS=http://服务器公网IP
```

有域名后填写：

```text
SITE_ADDRESS=moments.你的域名.com
```

把 Tavily 密钥填写在 `TAVILY_API_KEY=` 后面。密钥只保存在服务器，不提交到 GitHub。

## 六、启动网站

```bash
docker compose --env-file .env.production up -d --build
bash deploy/check.sh
```

第一次构建通常需要几分钟。完成后，先用 `http://服务器公网IP` 测试。

## 七、绑定域名与 HTTPS

在域名解析控制台新增一条记录：

- 记录类型：A
- 主机记录：moments
- 记录值：服务器公网 IP
- TTL：默认

解析生效后，把 `.env.production` 的 `SITE_ADDRESS` 改成正式域名，然后执行：

```bash
docker compose --env-file .env.production up -d
```

Caddy 会自动申请并续期 HTTPS 证书。等待一两分钟后访问 `https://moments.你的域名.com`。

## 八、以后更新网站

每次 GitHub 有新版本，只需要在服务器中执行：

```bash
cd shenxue-moments-planner
bash deploy/update.sh
```

## 九、常用检查

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 app
docker compose --env-file .env.production logs --tail=100 caddy
```

当前 Vercel 备用地址：<https://shenxue-moments-planner.vercel.app/>
