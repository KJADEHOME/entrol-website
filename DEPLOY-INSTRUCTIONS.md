# Entrol 网站部署指南

## 本次更新内容

### 新增文件
- `blog.html` - 博客列表页面
- `blog/how-to-choose-pet-product-manufacturer.html` - 第一篇SEO文章

### 修改文件
以下所有页面都添加了 Blog 导航链接：
- `index.html` - 首页
- `about.html` - 关于我们
- `contact.html` - 联系我们
- `products.html` - 产品总览
- `cat-tree.html` - 猫树产品页
- `pet-apparel.html` - 宠物服饰产品页
- `pet-bedding.html` - 宠物床品产品页

## 部署步骤

### 方式一：GitHub Pages（推荐）

如果网站目前使用 GitHub Pages 部署：

1. **解压文件**
   ```
   解压 entrol-website-with-blog.zip
   ```

2. **进入项目目录**
   ```
   cd entrol-website-main
   ```

3. **初始化 Git（如果还没有）**
   ```bash
   git init
   git add .
   git commit -m "Add blog section and first SEO article"
   ```

4. **关联远程仓库并推送**
   ```bash
   git remote add origin https://github.com/你的用户名/entrol-website.git
   git branch -M main
   git push -u origin main
   ```

5. **等待 GitHub Pages 自动部署**
   - 通常 1-2 分钟后生效
   - 访问 https://www.entrol.com 查看

### 方式二：FTP/服务器上传

如果网站托管在自己的服务器：

1. **备份现有网站**
   - 将服务器上的网站文件备份到本地

2. **上传新文件**
   - 上传所有文件到服务器根目录
   - 确保 `blog.html` 和 `blog/` 文件夹都在根目录

3. **检查权限**
   - 确保所有 HTML 文件可读
   - 确保文件夹权限正确

4. **测试访问**
   - 访问 https://www.entrol.com/blog.html
   - 检查导航栏的 Blog 链接是否正常

## 部署后检查清单

- [ ] 首页能正常打开
- [ ] 导航栏有 Blog 链接
- [ ] 点击 Blog 能进入博客列表页
- [ ] 博客列表页显示第一篇文章
- [ ] 点击文章标题能进入详情页
- [ ] 手机端菜单也有 Blog 链接
- [ ] 所有原有页面功能正常

## 常见问题

**Q: 部署后样式乱了怎么办？**
A: 检查 CSS 文件路径是否正确，确保 `styles.css` 在根目录且可访问。

**Q: 博客页面显示 404？**
A: 检查 `blog/` 文件夹是否上传成功，以及服务器是否支持子目录访问。

**Q: 导航链接点不了？**
A: 检查文件路径，确保所有 HTML 文件在同一目录层级。

## 联系支持

如有问题，联系网站开发人员或冰沙协助。
