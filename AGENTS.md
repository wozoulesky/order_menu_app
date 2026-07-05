# AGENTS.md

> 本文件是给 AI 助手（包括未来的我）的项目交接说明。
> 每次接手本项目时，**必须先完整阅读本文件**，再开始任何改动。
> 它记录了项目约定、架构决策、踩过的坑和操作规范，避免重复犯错。

---

## 一、项目概况

- **名称**：做饭这件小事（微信小程序）
- **用途**：个人菜谱 + 朋友点餐。非商业化，个人 + 朋友使用。
- **技术栈**：原生微信小程序（WXML + WXSS + JS）+ 微信云开发（云数据库 + 云函数 + 云存储）
- **需求文档**：`需求文档.md`（权威需求来源，改动需求先改它）
- **使用流程**：朋友浏览菜品 → 加菜 → 下单（不支付）→ 主人查看全部订单 → 按菜谱做法做菜

---

## 二、目录结构

```
order_menu_app/
├── app.js / app.json / app.wxss      入口与全局配置
├── project.config.json               工程配置（含 cloudfunctionRoot，勿删）
├── 需求文档.md / README.md / AGENTS.md
├── data/dishes.js                    旧菜品数据（已不再引用，留作备份，勿删）
├── utils/
│   ├── login.js                      身份信息（昵称/头像）缓存
│   ├── cart.js                       「本次菜单」管理
│   └── master.js                     主人权限判断
├── pages/
│   ├── index/    首页（启动页，分类浏览 + 加入菜单，读云数据库，无需登录）
│   ├── detail/   详情页（菜谱 + 加入菜单 + 主人编辑入口，无需登录）
│   ├── order/    订单页（提交订单 + 查看历史 + 主人加菜入口 + 退出登录，需登录）
│   ├── login/   登录页（从订单页入口进入，微信一键登录）
│   └── admin/edit/   添加/编辑菜品页（仅主人可进，有 id 参数=编辑模式）
└── cloudfunctions/
    ├── submitOrder/    提交订单
    ├── getOrders/      查询订单（含主人权限）
    ├── getDishes/      读取菜品（含图片临时链接）
    ├── saveDish/       新增/编辑菜品（仅主人）
    └── initDishes/     一次性导入菜品（支持 JSON 参数或内置示例）
```

---

## 三、关键配置（改了会出问题，动之前三思）

### 3.1 云环境 ID

- 位置：`app.js` 的 `wx.cloud.init({ env: 'cloud1-d5gm8ix9c189893bf' })`
- 这是主人的真实云环境 ID，**不要改成占位符**。

### 3.2 主人 openid 白名单

- 位置：`cloudfunctions/getOrders/index.js` 和 `cloudfunctions/saveDish/index.js` 顶部的 `MASTER_OPENIDS`
- 当前主人 openid：`o7yJC17hTIbR9WnoISV1tJFydkJE`
- **两个文件都要保持一致**，改了一个必须改另一个，否则权限不一致。

### 3.3 project.config.json

- 必须有 `"cloudfunctionRoot": "cloudfunctions/"`，否则开发者工具不识别云函数目录，右键没有「上传并部署」选项（这是阶段三踩过的大坑）。

### 3.4 AppID

- `project.config.json` 的 `appid` 是主人正式 AppID，测试号不支持云开发。

---

## 四、架构决策（为什么这么做）

### 4.1 菜品数据在云数据库，不在本地文件

- `data/dishes.js` 是阶段一的遗留，**已不再被任何页面引用**，保留仅作备份。
- 菜品数据存在云数据库 `dishes` 集合，通过 `getDishes` 云函数读取。
- 原因：主人要随时加菜/改菜，不重新发版。本地文件做不到这点。
- 详情页用 `app.globalData.dishesCache` 缓存（首页拉取后存），避免重复请求。

### 4.2 按需登录（审核合规）

- **首页是启动页**（app.json pages 首位），用户进小程序直接浏览，不强制登录。
  - 原因：微信审核要求，不能一进小程序就要求授权登录，必须先让用户体验功能。
- 登录触发时机：用户点「我的订单」时，未登录则跳登录页。
- 登录页 `pages/login` 用微信一键登录（chooseAvatar 取头像 + nickname 输入框带出昵称）。
- 流程：填昵称 → 保存到 login 工具 → 调 getOrders 拿 openid+isMaster 存 master 工具 → 跳订单页。
- 登录态缓存（login.getUserInfo().nickName 非空=已登录），下次进订单页自动通过。
- 退出登录在订单页，调 `login.logout()`（清身份+清主人信息+reLaunch 回首页，让用户能继续浏览）。
- 订单页 onShow 二次校验登录态，未登录 redirectTo 登录页（防绕过）。

### 4.3 登录用「头像昵称填写能力」，不用 wx.getUserProfile

- 微信已停用 `wx.getUserProfile` 返回真实头像昵称。
- 头像选择用 `wx.chooseMedia`（取消静默忽略），昵称用 `<input type="nickname">`。
- 头像可选，昵称必填。openid 由云函数自动获取，前端无需手动拿。

### 4.4 主人权限双重校验

- 前端：`utils/master.js` 的 `isMaster()` 做体验层拦截（非主人看不到加菜入口、进不了添加页）。
- 云端：`saveDish` 云函数再次校验 openid 白名单（防绕过）。
- **前端校验只是体验，真正安全靠云函数**。

### 4.5 订单每道菜点/不点，不选份数

- 阶段一确认的决策。`utils/cart.js` 用 id 集合实现，同一道菜不重复。

### 4.6 编辑菜品复用添加菜品页

- `pages/admin/edit` 同时支持新增和编辑：有 `?id=xxx` 参数=编辑模式。
- 编辑模式：onLoad 调 getDishes 拿单条数据回填表单，保存时 dish 带 `_id`，saveDish 走 update 分支（云函数无需改）。
- 入口：详情页底部「✏️ 编辑这道菜」按钮（仅主人可见，读 master.isMaster()）。
- 编辑保存后清 dishesCache，返回详情页 onShow 重新拉取显示更新。

---

## 五、踩过的坑（务必避免）

### 5.1 云函数部署失败 → "调用成功"但没写库

- **现象**：云函数返回带 `tcbContext`、`userInfo`、入参原样回显，数据库无数据。
- **原因**：云函数没真正部署到云端（没配置 `cloudfunctionRoot`、或没右键上传部署）。
- **排查**：看云开发控制台 → 云函数列表，有没有对应函数。
- **解决**：确保 `project.config.json` 有 `cloudfunctionRoot`，右键云函数文件夹 →「上传并部署：云端安装依赖」。

### 5.2 改了云函数代码必须重新部署

- 本地改 `cloudfunctions/*/index.js` 后，云端不会自动更新。
- **每次改云函数，都要重新「上传并部署」**，否则线上跑的是旧代码。

### 5.3 图片路径不能引用不存在的本地文件

- 阶段二踩过：`/images/avatar-default.png` 不存在导致渲染层 500。
- 没有图片时用 emoji 占位（`wx:if` 条件渲染），**不要 fallback 到不存在的本地路径**。

### 5.4 chooseAvatar 在 Windows 开发者工具上取消会报错

- `open-type="chooseAvatar"` 已弃用且兼容性差。
- 头像选择统一用 `wx.chooseMedia`，`fail` 回调里静默忽略取消操作。

### 5.5 getApp() 在文件顶部调用

- 小程序页面 js 里 `const app = getApp()` 要写在文件顶部，不要放底部，否则函数体内用到 `app` 时未定义。

---

## 六、云函数清单与职责

| 云函数 | 职责 | 权限 | 改动注意 |
| --- | --- | --- | --- |
| `getDishes` | 读菜品，图片 fileID 转临时链接 | 所有人 | 无 |
| `saveDish` | 新增/编辑菜品 | 仅主人（云端校验） | 白名单与 getOrders 一致 |
| `getOrders` | 查订单，主人查全部，他人查自己 | 所有人（返回 isMaster） | 返回 openid 供前端缓存主人状态 |
| `submitOrder` | 提交订单 | 所有人 | 校验昵称、菜品非空 |
| `initDishes` | 批量导入菜品 | 所有人（建议用完删） | `CLEAR_EXISTING` 控制是否清空；支持 event.dishes 参数 |

### 部署新云函数的完整步骤

1. 确认 `project.config.json` 有 `cloudfunctionRoot`
2. 右键 `cloudfunctions/对应函数` 文件夹 →「上传并部署：云端安装依赖」
3. 等待「上传成功」提示
4. 云开发控制台 → 云函数列表确认存在

---

## 七、数据库集合

| 集合 | 用途 | 权限设置 |
| --- | --- | --- |
| `dishes` | 菜品数据 | 仅创建者可读写（走云函数） |
| `orders` | 订单数据 | 仅创建者可读写（走云函数） |

### dishes 文档结构

```js
{
  _id, name, category, imageFileID,
  ingredients: [{ name, amount }],
  seasonings:  [{ name, amount }],
  steps: [string],
  createTime, updateTime
}
```

### orders 文档结构

```js
{
  _id, openid, nickname, avatarUrl,
  dishes: [{ id, name }],   // id 是 dishes 的 _id
  createTime
}
```

---

## 八、分类（写死，改要同步多处）

固定 5 类：`荤菜、素菜、汤品、主食、饮品`

涉及位置（改分类要全部同步）：
- `cloudfunctions/getDishes/index.js` 的 `CATEGORIES`
- `cloudfunctions/saveDish/index.js` 的 `VALID_CATEGORIES`
- `cloudfunctions/initDishes/index.js` 内置示例菜
- `pages/admin/edit.js` 的 `CATEGORIES`
- `pages/index/index.js` 的 `DEFAULT_CATEGORIES`

---

## 九、版本管理规范

### 9.1 仓库

- GitHub：`git@github.com:wozoulesky/order_menu_app.git`
- 主分支：`main`
- 已配置 `.gitignore`：排除 node_modules、`project.private.config.json`、系统/编辑器文件

### 9.2 提交前必做

1. **改了云函数代码**：提醒主人重新部署（本地改不会自动生效到云端）。
2. **改了需求**：先更新 `需求文档.md`，再写代码。
3. **不要提交**：`project.private.config.json`、node_modules、敏感密钥。

### 9.3 提交信息格式

```
<类型>: <简述>

<可选的详细说明>
```

类型：`feat`(新功能) / `fix`(修bug) / `docs`(文档) / `refactor`(重构) / `style`(样式) / `chore`(杂项)

示例：
```
feat: 详情页增加编辑菜品功能
fix: 修复首页图片不显示
docs: 更新 README 部署步骤
```

### 9.4 推送流程

```bash
git add -A
git commit -m "类型: 说明"
git push
```

> 主人要求：**每次完成功能改动后，主动询问是否要提交推送**，不要自动提交。

---

## 十、待办与未来方向（阶段四，按需做，不预设）

- ~~编辑已有菜品~~ ✅ v1.1 已实现
- 删除菜品
- 搜索菜品（菜多了再加）
- 下单备注（如「少辣」「不吃香菜」）
- 历史订单按日期汇总成采购清单

**原则：按需扩展，不按清单扩展。** 先把现有功能用顺，哪里痛再补哪里。

---

## 十一、给未来 AI 助手的工作守则

1. **先读本文件和 `需求文档.md`**，再动代码。
2. **改需求先改文档**，文档和代码不一致时以文档为准，但要同步代码。
3. **改云函数后提醒主人重新部署**。
4. **不要自动 git commit/push**，改完先告诉主人，询问后再提交。
5. **遇到"云函数调用成功但没效果"**，第一反应检查是否真正部署（见第五节）。
6. **图片用 emoji 占位或云存储 fileID**，不要引用不存在的本地路径。
7. **保持代码风格一致**：2 空格缩进、单引号、中文注释、与现有文件风格统一。
8. **不擅自扩大范围**：用户没要求的功能不做，明确排除项见需求文档第十节。
