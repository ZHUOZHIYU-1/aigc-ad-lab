# 部署上线指南

本项目是**纯静态站点**（HTML + CSS + ES Module JavaScript + 本地 Three.js），无需 Node 服务端、无需构建步骤、无需数据库。任何能托管静态文件的平台都可以直接部署。

> **虚拟影棚实验室为可实操 3D 场景编辑器**：支持布景物体的选中/移动/旋转/缩放/改色/换材质/复制/删除/撤销，添加几何体，上传 GLB/GLTF 模型、物体贴图、广告画面与场景背景，以及布光参数单导出和场景截图。`vendor/` 中已本地化 `GLTFLoader.js` 与 `utils/BufferGeometryUtils.js`，部署时需与 `three.module.js`、`OrbitControls.js` 一并上传，保持目录结构不变。

---

## 一、部署前检查清单

| 检查项 | 状态 | 说明 |
|---|---|---|
| 首页 `index.html` 存在 | ✅ | 站点入口 |
| `css/`、`js/`、`vendor/` 三个目录完整 | ✅ | 样式、交互、Three.js 库 |
| 模块映射（importmap）指向本地文件 | ✅ | 不依赖外部 CDN，离线可用 |
| WebGL 降级提示 | ✅ | 不支持 WebGL 的浏览器显示友好提示 |
| 响应式适配 | ✅ | 桌面 / 平板 / 手机均已验证 |
| 控制台零错误 | ✅ | Chrome 实测通过 |

> **重要**：部署时必须保持目录结构不变。`index.html` 中 `./vendor/three.module.js`、`./vendor/OrbitControls.js`、`./js/main.js`、`./css/style.css` 都是相对路径。

---

## 二、方案 A：Vercel 部署（推荐，最快）

适合：有 GitHub 账号、想要 HTTPS + 全球 CDN + 自动更新的场景。

1. 将整个ilab-portal 目录推送到 GitHub 仓库（新建仓库即可）。
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录，点击 **Add New → Project**。
3. 导入刚才的仓库，构建配置保持默认（Framework Preset 选 **Other**）：
   - Build Command：**留空**
   - Output Directory：`.`（根目录）
   - Install Command：**留空**
4. 点击 **Deploy**，约 30 秒后获得形如 `https://your-project.vercel.app` 的网址。
5. **验证**：打开网址，确认首页加载、点击"进入虚拟实验室"能拖拽灯光。

> 后续更新：只要 `git push`，Vercel 会自动重新部署。

---

## 三、方案 B：Netlify 部署（拖拽即传，无需 Git）

适合：不想配置 Git、想最快看到效果。

1. 将ilab-portal 目录压缩为 `site.zip`（包含 `index.html` 及 `css/`、`js/`、`vendor/`）。
2. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)，把整个**项目文件夹**拖到页面区域。
3. 部署完成后获得 `https://xxx.netlify.app` 网址，可自定义子域名。
4. **验证**：打开网址测试实验室交互。

> 注意：拖拽时要拖**文件夹**而不是 zip，这样目录结构才正确。

---

## 四、方案 C：GitHub Pages（免费，适合高校项目）

1. 在 GitHub 新建仓库，例如 `ad-virtual-lab`。
2. 推送项目文件到 `main` 分支。
3. 进入仓库 **Settings → Pages**：
   - Source 选择 `Deploy from a branch`
   - Branch 选 `main`，目录选 `/ (root)`
   - 点击 Save
4. 等待 1–2 分钟，访问 `https://<用户名>.github.io/ad-virtual-lab/`。

> 若使用了子路径（如 `/ad-virtual-lab/`），因为本项目全部用相对路径，无需额外配置。

---

## 五、方案 D：自有服务器 / 校园内网服务器（对接实验空间平台）

申报书要求"通过 HTTPS 与实验空间平台完成数据接口联通"，若部署在校园服务器：

1. **放置文件**：把ilab-portal 目录放到 Nginx 的站点根目录，例如 `/var/www/html/lab/`。
2. **Nginx 配置示例**（`/etc/nginx/sites-available/lab`）：

   ```nginx
   server {
       listen 80;
       server_name lab.yourschool.edu.cn;
       root /var/www/html/ilab-portal;
       index index.html;

       # ES Module 需要正确的 MIME 类型
       location ~* \.js$  { add_header Content-Type application/javascript; }
       location ~* \.css$ { add_header Content-Type text/css; }

       # 启用 gzip 压缩（three.module.js 约 1.3MB）
       gzip on;
       gzip_types application/javascript text/css text/html;
   }
   ```

3. **启用 HTTPS**（实验空间平台要求 HTTPS）：

   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d lab.yourschool.edu.cn
   ```

4. **验证**：

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   curl -I https://lab.yourschool.edu.cn/
   ```

5. **接口联通**：本展示站点目前是纯前端演示，如需与"国家虚拟仿真实验教学课程共享平台"（ilab-x.com）完成数据接口联通（登录、成绩回传、学习行为记录），需按《"人工智能+"虚拟仿真实验教学项目技术接口规范（2026版）》另行对接后端接口——这部分不在本门户站点范围内。

---

## 六、自定义域名（可选）

以 Vercel 为例：
1. 在项目 **Settings → Domains** 添加你的域名（如 `lab.example.com`）。
2. 在域名 DNS 服务商处添加一条 **CNAME** 记录指向 `cname.vercel-dns.com`。
3. 等待 DNS 生效（几分钟到几小时），Vercel 会自动签发 Let's Encrypt 免费 SSL 证书。

> **DNS 影响评估**：修改 DNS 会影响该域名原有的解析，操作前请确认该域名未被其他关键服务使用。建议先用子域名测试。

---

## 七、常见问题排查

| 问题 | 原因 | 解决 |
|---|---|---|
| 页面空白、控制台报 404 | 目录结构被破坏，相对路径失效 | 确保 `css/`、`js/`、`vendor/` 与 `index.html` 同级 |
| 3D 实验室显示"未启用 WebGL" | 浏览器禁用硬件加速 / 老旧浏览器 | 换 Chrome/Edge 最新版，或在浏览器设置中开启硬件加速 |
| 模块加载报 CORS 错误 | 用 `file://` 直接双击打开 | 必须通过 HTTP(S) 服务器访问，不能双击打开 HTML |
| 灯光拖拽无反应 | 点到空白处（此时是旋转视角） | 点选彩色光晕灯具或右侧灯光卡片后再拖拽 |
| 移动端画面卡顿 | 设备性能不足 | 关闭其他应用；站点已限制像素比 ≤2 以减轻负载 |

---

## 八、上线后验证步骤

1. 打开线上网址，确认首屏 Hero、导航、各章节正常显示。
2. 点击导航"进入虚拟实验室"，确认 3D 场景加载（约 1–2 秒）。
3. 拖拽任意灯具，观察物体光照变化与评分联动。
4. 切换"侧逆光"预设和"玻璃"材质，确认场景实时响应。
5. 点击"导出布光参数单"，确认弹窗内容与下载功能正常。
6. 用手机访问，确认布局自适应、触控可拖拽灯光。

完成以上步骤即可正式交付使用。
