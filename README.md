# Sarmay.github.io

Sarmay 的个人博客与 GitHub Pages 站点。仓库保存的是 VuePress 1.6.0 已生成的静态文件，可以直接由任意静态文件服务器托管。

> 当前仓库不包含 VuePress 源码配置或 `package.json`；维护时修改的是最终发布产物。重新生成原始 VuePress 站点后，需要再次运行本仓库的 Qazaqsha/RTL 处理脚本。

## 语言与路由

| 语言 | 入口 | HTML 语言标签 | 布局方向 |
| --- | --- | --- | --- |
| 简体中文 | `/` | `zh-CN` | LTR |
| Қазақша（西里尔字母） | `/kz/` | `kk-Cyrl` | LTR |
| قازاقشا（阿拉伯字母） | `/qaz/` | `kk-Arab` | RTL |

顶部语言菜单可以在三个版本之间切换。`/qaz/` 页面采用从右向左的书写与展示方式，并使用 `ALKATIP Basma Tom` 字体；中文和西里尔字母页面不会应用该字体。

## Qazaqsha、RTL 与字体

- `assets/js/locale-direction.js`：在首次加载和前端路由切换时同步 `<html>` 的 `lang` 与 `dir`。
- `assets/css/rtl.css`：处理导航栏、侧边栏、正文、搜索框及移动端布局的 RTL 镜像规则。
- `assets/fonts/ALKATIPBasmaTom.ttf`：`/qaz/` 页面使用的 `ALKATIP Basma Tom Regular` 字体。
- `scripts/add-qazaqsha-rtl.mjs`：为现有 VuePress 静态产物补充 Qazaqsha 路由、页面、语言菜单和 RTL 资源引用。脚本可以重复执行。

字体文件会通过 `@font-face` 加载，并且只在 `html[dir="rtl"]` 下生效。公开发布或再分发字体前，请确认拥有相应授权。

## 主要目录

```text
.
├── assets/
│   ├── css/                 # VuePress 样式与 RTL 样式
│   ├── fonts/               # 图标字体与 ALKATIP 字体
│   └── js/                  # VuePress bundle 与语言方向脚本
├── kz/                      # Қазақша（西里尔字母）页面
├── qaz/                     # قازاقشا（阿拉伯字母、RTL）页面
├── scripts/                 # 静态产物维护脚本
├── index.html               # 简体中文首页
└── 404.html                 # GitHub Pages 404 页面
```

## 本地预览

在仓库根目录启动静态服务器：

```bash
python3 -m http.server 4173
```

然后访问：

- 中文：<http://127.0.0.1:4173/>
- Қазақша：<http://127.0.0.1:4173/kz/>
- قازاقشا：<http://127.0.0.1:4173/qaz/>

不要直接双击 HTML 文件预览；站点资源使用根路径引用，需要通过 HTTP 服务器访问。

## 维护 Qazaqsha 页面

当原始 VuePress 静态文件有更新时，在仓库根目录执行：

```bash
node scripts/add-qazaqsha-rtl.mjs
```

该脚本会更新 Qazaqsha 页面、路由、语言菜单及 RTL 资源引用。执行后应检查 Git diff，确认生成内容与原站点的新版本匹配。

## 发布前验证

```bash
node --check scripts/add-qazaqsha-rtl.mjs
node --check assets/js/locale-direction.js
node scripts/add-qazaqsha-rtl.mjs
git diff --check
```

随后通过本地静态服务器分别检查桌面端和移动端：

1. 三个语言入口均可打开，语言菜单链接正确。
2. `/qaz/` 的 `dir` 为 `rtl`、`lang` 为 `kk-Arab`，正文使用 `ALKATIP Basma Tom`。
3. 中文与 `/kz/` 保持 LTR，且不使用 ALKATIP 字体。
4. 导航栏、侧边栏、搜索框和正文没有横向溢出或遮挡。

## GitHub Pages 部署

站点通过仓库根目录发布。验证完成后，将变更提交并推送到 GitHub Pages 当前使用的分支（本仓库为 `master`）；GitHub Pages 完成部署后即可访问线上版本。
