# ラク請求（japan-invoice-landing）迭代方案 NEXT-STEPS

> 更新日：2026-10-12 ／ 对象：`products/japan-invoice-landing/`（https://www.reveriel.com/japan-invoice-landing/）
> 定位：矩阵中**唯一的付费落地页**（Product JSON-LD `price: 980`）。已上线（线上返回 200）。

---

## 0. 本次盘点结论（与任务假设的偏差）

任务派发时假设「页脚 利用規約／プライバシーポリシー／特定商取引法 三个链接还是占位」。
**实测：三个法务页早已存在、且 index.html 页脚已链接到真实页面**（`terms.html` / `privacy.html` / `legal.html`），
线上版本与本地一致。因此本次工作重心调整为**合规缺陷修复 + 转化缺口规划**，而非从零新建页面。

现状盘点：

| 项目 | 状态 |
| --- | --- |
| `terms.html` 利用規約 | 已存在，13 条 + 附则，内容完整 |
| `privacy.html` プライバシーポリシー | 已存在，取得情報/利用目的/第三者提供/安全管理/開示請求 均有 |
| `legal.html` 特定商取引法に基づく表記 | 已存在，販売事業者 GUO XING／所在地 大阪府大阪市／価格 980 円 等 |
| index.html 页脚三链接 | 已指向真实页面（非占位） |
| canonical 绝对 URL | 首页有；**三个法务页原本缺失** → 本次已补 |
| JSON-LD Product price 980 | 首页有 |
| 反馈 FAB + Google フォーム | 有 |
| Cloudflare beacon `6fc01bf3ac5e457ba1bd16b91e5b653e` | 首页 + 3 法务页均有 |
| 互链（関連ツール） | 页脚有 → `japan-invoice-pdf` |
| **购买入口** | **不存在**（¥980 卡片 CTA 指向 `#signup` 先行登録） |
| **支付方式** | **未定**（特商法页写「クレジットカード決済を予定しています」） |

---

## 1. 本次已实施（硬性迭代）

1. **邮箱公开策略对齐运营者方针**：方针是「只披露 大阪府大阪市，不公开电话/地址，邮箱仅要求时提供」。
   原本 `contact@reveriel.com` 被公开在 5 处（首页页脚、script.js、legal/privacy/terms），
   且 script.js 注释自认「公開前に実在確認が必要」＝未验证。本次全部改为**不公开**：
   - `legal.html`：電話番号／メールアドレス 两行改为「請求があった場合には、遅滞なく開示いたします」，
     新增「お問い合わせ」行指向反馈表单。
   - `privacy.html`：窓口改为反馈表单 + 「メールアドレスは請求があった場合に開示」。
   - `terms.html`：同上。
   - `index.html`：页脚 `mailto:` → 反馈表单链接。
   - `script.js`：`CONTACT_EMAIL` 置空（保留一行可重新启用），新增 `FEEDBACK_FORM_URL` 作为回退。
     未设定邮箱时，提交先行登録会打开反馈表单，提示在「連絡先（任意）」栏填写邮箱。
     （该表单实测含字段：どのサービス？／ご意見・ご要望／連絡先（任意））
2. **三个法务页补 `<link rel="canonical">`**（绝对 URL，符合上线自检清单）。
3. **privacy.html 第三方披露补正**：原第 3 条写「提供予定の解析機能」与实际不符（Cloudflare Web Analytics 已上线）。
   现明确写出 Cloudflare Web Analytics（不使用 Cookie、不特定个人）+ Google Fonts + Google フォーム。
4. **terms.html 第 11 条**：原本「直近1か月分」对上买断制（¥980 一次性）不成立，改为按买断/月额分别定义上限。
5. **index.html 价格卡补「税込」告知**（原本 ¥980 未标税込，特商法页却写税込 → 景表法 総額表示 上不一致）。
6. `sitemap.xml` lastmod 更新为 2026-10-12（4 个 URL）。

---

## 2. P0 — 付费页合规缺口（必须在上线推广前解决）

### 2.1 「买得到」才算付费落地页 ⚠️ 最高优先
现状：产品卡写「スタンダード ¥980 買い切り」「いちばん人気」，但按钮只是 `#signup`（邮件登记）。
JSON-LD 却声明 `"price":"980"` + `availability: InStock`。
→ **结构化数据声明可购买、页面却买不到**，属于 Google 结构化数据政策下的误导性标记，有被降权/富媒体结果失效的风险；
且对用户是空转化路径。

**要做**：二选一，尽快定。
- (A) 上真购买入口：Stripe Checkout（`mode: payment`，一次性 ¥980）。
  CTA 文案区分「先行登録（無料）」与「今すぐ購入（¥980）」。
- (B) 暂时买不到：把 JSON-LD 降级为 `"availability": PreOrder`（或改用 `SoftwareApplication` + `offers` 无 availability），
  并在价格卡明示「発売前・先行登録で確保」。**至少不要维持 InStock 的现状。**

### 2.2 支付方式决策：**不要用 Merchant of Record**
`legal.html` 目前写「クレジットカード決済を予定」。
- 若用 Stripe / PAY.JP / Square（日本向け PSP）→ 販売主体＝GUO XING，现特商法表記成立。
- 若用 Gumroad / Lemon Squeezy / Paddle 等 MoR → **法律上の販売業者は MoR 会社**，
  特商法表記必须改写为 MoR 主体，与现在写 GUO XING 矛盾。这是最容易被忽略的合规陷阱。
- 建议：Stripe Checkout（日本个人事业主可开、支持 ¥980 单次支付、有 hosted page 免 PCI）。

### 2.3 特商法表記与实际一致
- 「お支払い方法」「引渡時期」目前是**预定语气**（「予定しています」）。一旦接入支付，必须改成确定性表述。
- 「返品・キャンセル」对数字役務的「提供開始後は返金不可」已有，但要与 Stripe 的退款政策页口径一致。
- 「販売価格」列出 ¥500/月 サポート付き 与 β版無料——若发售时不上这两个，需删掉，避免与实际不符。

### 2.4 邮箱策略的再评估（建议）
本次已按方针收敛为「请求时开示」。
但**付费产品完全不提供可见联系方式会明显降低信任与转化**（尤其日本用户）。
建议折中：公开一个专用别名（如 `support@reveriel.com`）**仅在特商法页与隐私页**掲載，
市场营销页仍走表单。前提：该邮箱必须真实可用、能收信并有人回。若暂不具备，维持现状即可。

---

## 3. P1 — 转化优化

### 3.1 免费版导流（现成的最大浪费）
`フリー` 卡的 CTA 现在是「無料ではじめる」→ `#signup`（同一先行登録）。
**免费层应当导流到矩阵里已经能用、且能带来自然流量的免费工具**，形成「先用免费工具 → 再买 ¥980」的漏斗：
- `フリー` CTA → `https://www.reveriel.com/japan-invoice-pdf/`（適格請求書 免费工具，现成可用）
- 免费工具站反向补一个「作り続けたい人は ラク請求（¥980 買い切り）」的返回链接。
- 这样免费卡不再是「假功能表」，而是真实可点的下一步，同时给兄弟站带内链权重。

### 3.2 先行登録フォーム的转化损失（P0 兼 P1）
现在提交 → `window.open` 一个通用 Google フォーム，用户还要**重新输入**邮箱。
- 短期：改用能带 email 预填的表单（Formspree / Google Apps Script Web App / Tally），保留在页面内、单跳完成。
- 中期：按既定路线补后端（记忆：Web first, app later，数据层留接口），`script.js` 的 submit handler 直接换 `fetch()`。
- 表单区加一行「所要時間 10 秒」类微文案。

### 3.3 价格与信任
- 价格锚定 `¥4,800 → ¥980` 已有，可再补一句「先行登録者は永久にこの価格」的稀缺性（现仅在卡内，hero 未提）。
- hero 的 trust 列表可加「β版は無料・カード登録不要」（已有类似），以及**退款/问询口径**。
- 载入的 `compare` 表里 freee/マネーフォワード 的 `税抜` 标注要保留（已有），避免贬低他社的表述风险。

### 3.4 转化测量
Cloudflare Web Analytics 只看 PV，**看不到转化**。建议给关键 CTA 加轻量事件埋点
（如点击 `#signup`、点击 `#pricing`、表单 submit），至少用 beacon 的自定义事件或退而求其次用 URL 参数
（`?from=pricing`）区分入口，以便判断是价格卡还是 hero 在转化。

---

## 4. P2 — 内容层 & 日本 ASP 联盟（与矩阵战略一致）

- **内容层**：本页缺「解説記事」。可平移 matrix 已有模式（如 `chumonsho-pdf/kakikata.html`）新增：
  - `invoice-kakikata.html`（インボイス請求書の書き方）
  - `shiharai-kigen.html`（支払期限・督促の作り方）
  并在文末自然导流回 ¥980 卡片。
- **ASP 联盟**：本站是**销售方**，不适合挂竞品（freee/マネフォ）联盟广告——会直接打掉自己的转化。
  联盟位应放在**免费工具站**（`japan-invoice-pdf` 等）的結果画面下方，而非本落地页。本页只保留“自售”。
- **命名一致性（可选）**：matrx 其它 12 个站的特商法页统一叫 `company.html`，本站叫 `legal.html`。
  因本页**已上线且已进 sitemap**，重命名会造成 404，**不划算，维持 `legal.html`**；
  若将来统一，需同时改 index 页脚、privacy/terms 互链、sitemap 并保留 301（GitHub Pages 无服务端跳转，需用 meta refresh 占位）。

---

## 5. 上线前自检清单（针对本站）

- [x] canonical 绝对 URL（首页 + 3 法务页）
- [x] JSON-LD Product price 980
- [ ] **JSON-LD availability 与实际购买能力一致**（见 2.1）← 未决
- [x] 反馈 FAB + 表单入口（页脚 + FAB）
- [x] beacon token `6fc01bf3ac5e457ba1bd16b91e5b653e`（4 页）
- [x] 互链（页脚 関連ツール）
- [x] 特定商取引法に基づく表記
- [x] 利用規約 / プライバシーポリシー
- [ ] sitemap 提交（Search Console）与索引确认
- [ ] 支付渠道开通 + 特商法表記改定为确定表述

---

## 6. 验证方法（本地，未部署）

```bash
cd products/japan-invoice-landing
node --check script.js
# headless Chrome 渲染 + 链接存在性检查（见本次交付的验证脚本）
```
