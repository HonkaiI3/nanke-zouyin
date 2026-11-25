# 南科奏音

历届音游比赛档案和第六届 Phigros 线上预选实时榜。打开首页可查看当前排名，顶部导航可切换历届比赛。

## 本地运行

安装 Node.js 22 或更新版本，在仓库目录执行 `npm start`，打开 <http://127.0.0.1:8742>。项目仅使用 Node.js 内置模块，启动时会自动构建页面。

## 成绩同步

浏览器每 30 秒请求一次同源的 `/api/ranking`。服务端读取腾讯文档公开视图，以提交者名称合并记录，取最高分，同分并列。无法解析的成绩列入「待核对」。同步失败时，页面显示原因，可点击「恢复同步」。

## 发布到 Cloudflare Pages

正式站点为 [南科奏音](https://sus-click-club.pages.dev/)。后续网站更新默认发布到 Cloudflare Pages 项目 `sus-click-club` 的 `main` 生产分支。在具有该项目部署权限的环境中运行：

```sh
npm run build
npx wrangler pages deploy dist/pages --project-name sus-click-club --branch main
```

发布包包含网页、游戏图标及实时成绩接口。发布后在正式域名核对改动，并检查第六届排名能否加载。

## 其他 Node.js 主机

在支持 Node.js 的主机上运行 `npm start`。设置 `HOST=0.0.0.0` 以监听外部连接，并将 `PORT` 设为托管平台分配的端口。主机需要能够访问腾讯文档。仅将 HTML 上传至静态托管时，需另行部署成绩接口。
