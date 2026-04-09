# Entrol 网站上线完整操作手册

> 目标：将 `F:\龙虾\entrol-website` 发布为 `https://www.entrol.com`

---

## 第一步：联系表单确认（无需注册）

> 表单已配置为 **Formsubmit.co**（与 kjadehome 同款），邮件直接发到 `b.wu@entrol.com`。
> 免费版每月 50 次提交，B2B 询盘够用。无需额外注册，直接使用即可。

表单代码已配置：
```html
<form action="https://formsubmit.co/b.wu@entrol.com" method="POST">
```

✅ **无需额外操作，跳过此步骤。**

---

## 第二步：创建 GitHub 仓库并上传网站

### 2.1 安装 Git（如未安装）
- 下载：https://git-scm.com/download/win
- 安装时全部默认即可

### 2.2 创建 GitHub 账号（如未有）
- 打开 https://github.com，注册账号

### 2.3 创建仓库
1. 登录 GitHub，右上角点 **+** → **New repository**
2. Repository name 填：`entrol-website`（或你喜欢的名字）
3. 选 **Public**（GitHub Pages 免费版需要公开仓库）
4. 不勾选任何初始化选项，点 **Create repository**

### 2.4 上传文件
打开 PowerShell，执行以下命令：

```powershell
cd "F:\龙虾\entrol-website"
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/你的用户名/entrol-website.git
git push -u origin main
```

> 第一次 push 会弹出 GitHub 登录窗口，用浏览器授权即可。

### 2.5 开启 GitHub Pages
1. 进入仓库页面，点击 **Settings** → 左侧 **Pages**
2. Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**
4. 点 **Save**
5. 稍等 1-2 分钟，页面会显示：`Your site is published at https://你的用户名.github.io/entrol-website`

### 2.6 设置自定义域名
1. 在同一个 Pages 设置页面，找到 **Custom domain**
2. 填入：`www.entrol.com`
3. 点 **Save**（仓库里的 CNAME 文件已经有了，会自动识别）
4. 勾选 **Enforce HTTPS**（等 DNS 配置完成后再勾，否则会报错）

---

## 第三步：阿里云 DNS 解析配置

> 登录 https://dns.console.aliyun.com，找到 entrol.com 域名，进入解析设置。

### 需要添加的记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |
| CNAME | www | 你的用户名.github.io | 600 |

> ⚠️ 主机记录 `@` 代表根域名 `entrol.com`；`www` 代表 `www.entrol.com`。
> GitHub Pages 的 4 个 A 记录 IP 是固定的，直接按上表填即可。
> CNAME 的记录值改成你实际的 GitHub 用户名，如 `entrolweihai.github.io`。

### 操作步骤：
1. 点击 **添加记录**
2. 每一条按上表填写，保存
3. 5 条全部添加完毕
4. DNS 生效通常需要 5 分钟 ~ 24 小时（大多数情况下 10 分钟内）

### 验证 DNS 是否生效：
打开 PowerShell，输入：
```
nslookup www.entrol.com
```
如果返回 `185.199.xxx.153` 的 IP，说明 DNS 已生效。

---

## 第四步：验证网站上线

1. 打开浏览器，访问 `https://www.entrol.com`
2. 检查：
   - [ ] 页面正常显示
   - [ ] HTTPS 小锁标志出现
   - [ ] 图片全部加载
   - [ ] 联系表单可以提交（会发邮件到 b.wu@entrol.com）

---

## 第五步：Google Search Console 提交

> 告诉 Google 你的网站存在，加速收录。

### 5.1 添加属性
1. 打开 https://search.google.com/search-console
2. 用 Google 账号登录
3. 点击 **添加资源（Add property）**
4. 选 **URL 前缀** 方式，输入：`https://www.entrol.com`
5. 点 **继续**

### 5.2 验证所有权
选择 **HTML 标记** 验证方式：
1. 复制 Google 给你的 meta 标签，形如：
   ```html
   <meta name="google-site-verification" content="xxxxxxxx">
   ```
2. 打开 `index.html`，将这行加到 `<head>` 里（放在其他 meta 标签后面）
3. 保存文件，重新 push 到 GitHub：
   ```powershell
   cd "F:\龙虾\entrol-website"
   git add index.html
   git commit -m "Add Google Search Console verification"
   git push
   ```
4. 等 1-2 分钟 GitHub Pages 更新后，回到 Search Console 点 **验证**

### 5.3 提交 Sitemap
1. 验证成功后，左侧菜单点击 **Sitemaps（站点地图）**
2. 在输入框填入：`sitemap.xml`
3. 点 **提交**
4. 状态变为"成功"即可

> ✅ 提交后 Google 通常在 1-7 天内开始抓取收录。

---

## 后续建议

| 优先级 | 任务 |
|--------|------|
| ⭐⭐⭐ | 网站上线后，测试提交一次表单，确认 b.wu@entrol.com 能收到邮件 |
| ⭐⭐⭐ | 在 Google Search Console 查看覆盖率报告 |
| ⭐⭐ | 注册 Google Analytics 4，在 index.html 加入追踪代码 |
| ⭐⭐ | 在阿里云或 Google Domains 设置邮件 MX 记录（如需 b.wu@entrol.com 收信） |
| ⭐ | 为每个产品页面添加更多图片的 alt 文字 |

---

*本手册由 WorkBuddy 生成 · 2026-04-04*
> 表单使用 Formsubmit.co（同 kjadehome 方案），邮件发到 b.wu@entrol.com
