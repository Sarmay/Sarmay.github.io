# Sarmay.github.io

Sarmay 的个人博客与 GitHub Pages 站点，支持简体中文、Қазақша（西里尔字母）和 قازاقشا（阿拉伯字母、RTL）。

站点保留原有 VuePress 1.6.0 静态页面，同时增加 Markdown 文章源、Pages CMS 可视化后台和 GitHub Actions 自动部署。日常发布文章不需要在本地修改 HTML、执行 Git 或提交生成文件。

## 日常发布文章

1. 打开 <https://sarmay.github.io/admin/>，或者直接访问 <https://app.pagescms.org>。
2. 使用 GitHub 登录，并选择 `Sarmay/Sarmay.github.io` 仓库的 `master` 分支。
3. 进入“文章”，新建或编辑内容。
4. 填写标题、URL 标识、摘要、语言、分类和正文，选择“立即发布”。
5. 点击保存。

Pages CMS 会自动把文章保存为 `content/articles/*.md` 并创建 commit。随后 GitHub Actions 自动校验、构建并部署，不需要手动提交代码。

第一次使用 Pages CMS 时，需要按提示为该仓库安装 Pages CMS GitHub App。站点或仓库中不保存 GitHub 访问令牌。

## 首次启用自动部署

本仓库原先使用 `master:/` 的 legacy Pages 发布方式。合并本功能后，需要进行一次设置切换：

1. 打开仓库的 **Settings → Pages**。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 手动运行一次 `Deploy GitHub Pages` 工作流，或向 `master` 推送一次提交。

以后 Pages CMS 保存文章就会自动触发 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)。

## 语言与路由

| 语言 | 首页 | 文章列表 | HTML 语言标签 | 方向 |
| --- | --- | --- | --- | --- |
| 简体中文 | `/` | `/articles/` | `zh-CN` | LTR |
| Қазақша | `/kz/` | `/kz/articles/` | `kk-Cyrl` | LTR |
| قازاقشا | `/qaz/` | `/qaz/articles/` | `kk-Arab` | RTL |

每种语言继续使用现有分类路由：

- `blog/frontend/`
- `blog/backend/`
- `blog/server/`

构建时会为 `/kz/` 和 `/qaz/` 生成对应分类页。旧 VuePress 页面中的“博文”菜单也会自动增加“全部文章”入口。

## 内容字段

Pages CMS 由 [`.pages.yml`](.pages.yml) 配置，文章保存在 `content/articles/`。主要字段如下：

| 字段 | 用途 |
| --- | --- |
| `title` | 页面标题 |
| `slug` | 稳定网址，只允许小写英文字母、数字和连字符 |
| `description` | 列表和 SEO 摘要 |
| `date` | 发布日期，格式为 `YYYY-MM-DD` |
| `language` | `zh`、`kz` 或 `qaz` |
| `category` | `frontend`、`backend` 或 `server` |
| `tags` | 英文逗号分隔的标签 |
| `cover` | 可选封面图片 |
| `translation_key` | 三语言译文使用相同值即可互相切换 |
| `published` | `false` 时只作为草稿保存 |
| `body` | Markdown 正文 |

上传的图片保存到 `images/uploads/`，文章中写入 `/images/uploads/...` 公共路径。

## 构建方式

构建器会执行以下工作：

1. 复制现有 VuePress 静态站点到输出目录。
2. 保留并识别现有 6 篇历史文章。
3. 校验 `content/articles/*.md` 的 frontmatter。
4. 生成三语言文章总览、分类页和文章详情页。
5. 给三语言首页加入最新文章，并给旧 VuePress 页面注入文章入口和分类页完整跳转逻辑。
6. 输出 `articles.json` 和 `.nojekyll`，供 GitHub Pages 发布。

正式输出位于 `dist/`，预览草稿输出位于 `dist-preview/`。这两个目录都被 Git 忽略，不应提交。

## 本地开发

安装依赖：

```bash
npm ci
```

校验内容并运行测试：

```bash
npm run check
npm test
```

生成正式站点：

```bash
npm run build
```

包含草稿的本地预览：

```bash
npm run build:preview
npm run preview:drafts -- --port 4173
```

然后访问：

- 中文文章：<http://127.0.0.1:4173/articles/>
- Қазақша：<http://127.0.0.1:4173/kz/articles/>
- قازاقشا：<http://127.0.0.1:4173/qaz/articles/>
- 示例文章：<http://127.0.0.1:4173/articles/cms-example-draft/>

不要直接双击 HTML 文件预览，站点资源使用根路径引用。

## 草稿与发布

仓库包含一篇可在 Pages CMS 中直接编辑的示例文章：

```text
content/articles/cms-example-draft.md
```

- 是否发布由文章的 `published` 字段决定；示例文章也可以自由切换状态。
- `npm run build` 和线上部署不会包含 `published: false` 的草稿。
- `npm run build:preview` 会生成草稿，便于本地检查。
- 在 Pages CMS 中打开示例文章，可以直接观察各字段如何填写。

## Qazaqsha、RTL 与字体

- `assets/js/locale-direction.js` 在旧 VuePress 页面加载和前端路由切换时同步 `lang` 与 `dir`。
- `assets/css/rtl.css` 处理导航栏、侧边栏、正文、搜索框和移动端 RTL 布局。
- `assets/fonts/ALKATIPBasmaTom.ttf` 为 قازاقشا 页面提供 `ALKATIP Basma Tom` 字体。
- 新生成的文章页面直接输出 `lang="kk-Arab"` 和 `dir="rtl"`，同样使用上述 RTL 样式与字体。

公开发布或再分发字体前，请确认拥有相应授权。

## 旧 Qazaqsha 静态页面

重新生成原始 VuePress 产物后，仍可运行：

```bash
node scripts/add-qazaqsha-rtl.mjs
```

该脚本只负责旧 VuePress 产物中的 Qazaqsha 页面、路由和菜单。新文章由 `scripts/build-site.mjs` 自动处理，不需要修改此脚本。

## 主要目录

```text
.
├── .github/workflows/          # GitHub Pages 自动部署
├── admin/                      # 文章后台入口
├── assets/
│   ├── css/content-site.css    # 新文章页面样式
│   ├── fonts/                  # ALKATIP 与图标字体
│   └── js/                     # 文章交互和旧站导航接入
├── content/articles/           # Pages CMS 管理的 Markdown 文章
├── images/uploads/             # CMS 上传图片
├── scripts/                    # 内容校验、构建和本地服务器
├── tests/                      # 内容与构建测试
├── .pages.yml                  # Pages CMS 字段配置
└── package.json                # 构建命令和依赖
```

## 发布前检查

```bash
npm ci
npm run check
npm test
npm run build
git diff --check
```

GitHub Actions 会在每次部署前执行同样的内容校验和测试；失败时不会覆盖当前线上站点。
