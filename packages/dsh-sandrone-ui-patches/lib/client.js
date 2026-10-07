// dsh-sandrone-ui-patches（桑多涅的 UI 补丁，client 半区）：factory 期注入全局 CSS。
// 覆盖五件事：① 衬线字体方案（:root 基线 + 皮肤 body 克隆免疫）；② 字号基准（正文 22px / 代码块 16px）；
// ③ 超长 markdown 表格强制压缩；④ 暗色皮肤表格分割线对比度；⑤ crumb 限宽放开（标题集群居中已于 2026-09-27 撤销）。
// Pattern copied from dsh-client-ui-skin-center/lib/client.js (factory-time CSS injection).
// NOTE: the client module loader applies every entry as a cordis plugin, so the
// bundle exports MUST carry an `apply` function (isApplicable check), otherwise
// the entry fails to load with "invalid plugin ... received object".

window.__ModuleLoader__.load({
	id: "dsh-sandrone-ui-patches",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		// 字体栈单一权威源：:root 基线与 html body 克隆免疫块共用——改字体只动这两行常量。
		var SERIF_FAMILY = "'Source Serif 4 Display', 'Source Serif 4', 'Times New Roman', '仿宋', 'FangSong','思源宋体', 'Noto Serif CJK SC', serif";
		var CODE_FAMILY = "'Fira Code', '仿宋', 'FangSong', serif";

		// ── 字号基准（2026-10-07 新增，与 VSCode 对齐）─────────────────────────
		// CONTENT_SIZE 是 DSH 全部 markdown 字号的**唯一上游**：ui-theme 里
		//   --dsh-content-font-delta: calc(var(--dsh-content-font-size, 14px) - 14px)
		// 把 h1/h2/h3/h4/base/table 全写成 calc(<原字号> + delta) 的相对式，
		// 所以改这一个变量就能整体缩放正文族。
		// 但 code / code-block 是**硬编码绝对值**（12px / 11px），不参与 delta 链，
		// 必须单独覆盖 —— 否则正文放大后代码显得更小，正是本次要修的问题。
		var CONTENT_SIZE = "18px";
		// 代码块 16px = 小四（12pt @96dpi）。行内代码取同值，避免 22px 行里嵌 11px 的断崖。
		var CODE_SIZE = "16px";
		var CODE_LINE = "26px";        // 16px × 1.625
		var CODE_LINE_SMALL = "24px";

		var FONT_CSS = [
			":root {",
			"  /* 正文族：西文 Source Serif 4（人文衬线/手写味）打头 -> Times New Roman（印刷感兜底） -> 中文仿宋（手写感） -> 思源宋体（印刷感兜底） */",
			"  --dsw-font-family: " + SERIF_FAMILY + " !important;",
			"  /* 代码族（2026-10-07 与 VSCode 对齐）：Fira Code -> 中文仿宋 -> serif 兜底。",
			"     不再以 monospace 收尾：Windows 下裸 monospace 的 CJK 会落宋体，与仿宋正文打架。 */",
			"  --ds-font-family-code: " + CODE_FAMILY + " !important;",
			"}",
			"/* 皮肤字体变量 body 克隆免疫（2026-09-20 定案，取代逐皮肤特判）：",
			"   skin-center 的 CSS 管线（core/css-safety/transform.ts）把皮肤裸 :root/html 块里的自定义属性",
			"   逐行 clone 到 html[data-dsh-skin=\"<id>\"] body 上——token 类（--dsw-alias-* / --dsw-specific-*）",
			"   的 !important 会被剥掉，以让 body 上的暗色变体生效；其余自定义属性原样保留。CSS 变量继承",
			"   在最近祖先定义处停止，于是 body 上的克隆劫持整个正文子树，上面 :root 的 !important 穿不过去。",
			"   已知中招者（都在裸 :root 里重定义 --dsw-font-family）：matrix/skin.css（Menlo 等宽栈）、",
			"   xp/skin.css（Tahoma sans 栈）、deep-current/skin.css（-apple-system sans 栈）；其余皮肤",
			"   （furina/navia/harbor/mint/summer-liquid-glass/war-thunder）不定义字体变量，天然免疫。",
			"   修法收敛成 body 锚点、不再逐皮肤枚举：克隆的落点就是 body，且克隆出的字体声明至今无一使用",
			"   !important——同一元素（body）上先比重要性再比特异性，本块 !important 必胜，一份规则覆盖所有",
			"   现存与将来的皮肤。若日后某皮肤故意以 !important 写字体变量（今天没有），在此补回显式",
			"   html[data-dsh-skin=\"…\"] / html[data-dsh-skin=\"…\"] body 锚点即可（即旧版 matrix/xp 的写法）。",
			"   code/pre 于 2026-10-07 改为**全局压制**（见下方两层通用规则）；deep-current 会话标题仍保留",
			"   皮肤自己的 display 字体（组件级直接声明，变量覆盖动不了，2026-09-20 决策）。 */",
			"html body {",
			"  --dsw-font-family: " + SERIF_FAMILY + " !important;",
			"  --ds-font-family-code: " + CODE_FAMILY + " !important;",
			"}",
			"/* ── 字号基准（2026-10-07 新增，与 VSCode 对齐）────────────────────────────",
			"   ① 正文档：DSH 的 h1/h2/h3/h4/base/table 全是 calc(<原字号> + var(--dsh-content-font-delta))，",
			"      而 delta = calc(var(--dsh-content-font-size,14px) - 14px)。改这一个变量，整个正文族等比放大。",
			"   ② 代码档：code(12px) / code-block(11px) 是**硬编码绝对值**，不参与 delta 链，必须显式覆盖。",
			"   ③ ★ 简写陷阱：--dsw-font-markdown-code-block 把字号**字面量内联**在值里",
			"      （'11px/19px var(--ds-font-family-code)'），而 CodeCard / DiffBlock / SearchBlock /",
			"      TerminalBlock / CodeBlock 共六处用 `font: var(--dsw-font-markdown-code-block)` 简写取值。",
			"      CSS 变量是静态替换 —— 只改 -font-size 子变量**不会**重算简写变量，两者必须一起覆盖。",
			"   ④ 双锚点：与字体变量同理，:root 基线 + html body 克隆免疫，防皮肤管线劫持。 */",
			":root, html body {",
			"  --dsh-content-font-size: " + CONTENT_SIZE + " !important;",
			"  --dsw-font-markdown-code: " + CODE_SIZE + "/" + CODE_LINE + " var(--ds-font-family-code) !important;",
			"  --dsw-font-markdown-code-font-size: " + CODE_SIZE + " !important;",
			"  --dsw-font-markdown-code-line-height: " + CODE_LINE + " !important;",
			"  --dsw-font-markdown-code-block: " + CODE_SIZE + "/" + CODE_LINE + " var(--ds-font-family-code) !important;",
			"  --dsw-font-markdown-code-block-font-size: " + CODE_SIZE + " !important;",
			"  --dsw-font-markdown-code-block-line-height: " + CODE_LINE + " !important;",
			"  --dsw-font-markdown-code-block-small: " + CODE_SIZE + "/" + CODE_LINE_SMALL + " var(--ds-font-family-code) !important;",
			"  --dsw-font-markdown-code-block-small-font-size: " + CODE_SIZE + " !important;",
			"  --dsw-font-markdown-code-block-small-line-height: " + CODE_LINE_SMALL + " !important;",
			"}",
			"/* ── code/pre 字族的全局兜底与皮肤压制（2026-10-07）────────────────────────",
			"   背景：变量层的覆盖（--ds-font-family-code）只能管到「用变量取值」的地方；",
			"   只要有皮肤用**组件级直接声明** font-family，变量就穿不过去。",
			"   已知：matrix/patches.css:134 `code, pre { font-family: Menlo, Consolas, JetBrains Mono, monospace }`",
			"   （skin-center 管线 scope 成 html[data-dsh-skin=\"matrix\"] code ⇒ 特异性 0,1,2，无 !important）。",
			"   2026-09-07 的决策是「保留 Menlo」（终端美学）；2026-10-07 用户要求**全局覆盖**",
			"   （审美：练书法者偏好仿宋，认为无衬线观感差），故该决策作废。",
			"   ★ 不逐皮肤枚举：皮肤会陆续新增（9-07 记录 9 个 → 现 12 个，新增 blueprint /",
			"   crt-phosphor / remiel-starlit），逐皮肤特判必然漏。改为两层通用规则：",
			"     ① 裸元素层——无皮肤时也生效，!important 足以压过任何**非** !important 的皮肤声明；",
			"     ② 皮肤上下文层——借 [data-dsh-skin] 把特异性抬到 (0,1,2)+，",
			"        防将来某皮肤也用 !important 时被反压。",
			"   （变量层见上方 html body 锚点：crt-phosphor / deep-current / matrix / xp 四个皮肤",
			"     在 :root 重定义过 --dsw-font-family 或 --ds-font-family-code，同一锚点通用覆盖。） */",
			"code, kbd, samp, pre {",
			"  font-family: " + CODE_FAMILY + " !important;",
			"}",
			"html[data-dsh-skin] code,",
			"html[data-dsh-skin] kbd,",
			"html[data-dsh-skin] samp,",
			"html[data-dsh-skin] pre,",
			"html[data-dsh-skin] .md-code-block code,",
			"html[data-dsh-skin] .md-code-block pre,",
			"html[data-dsh-skin] [data-code-block-content] code,",
			"html[data-dsh-skin] [data-code-block-content] pre {",
			"  font-family: " + CODE_FAMILY + " !important;",
			"}",
			"/* ── 代码块头部文字（语言标签 .language / 标题 .title）字号（2026-10-07）──────────",
			"   病灶：CodeCard.module.css 的 .language / .title **不声明 font-size**，只给 color 与",
			"   font-family —— 字号靠继承自祖先那句 `font: var(--dsl-code-block-banner-font)`（11px）。",
			"   没有变量可改，只能上选择器。",
			"   锚点：data-code-block-banner 由 CodeBlock.tsx 写死，稳定；",
			"   类名形如 _language_<hash>_<n>，带 CSS Module 哈希，故用类名**子串**匹配抗哈希漂移。",
			"   取 15px：与 16px 的代码正文略错开，页头文字不该与代码正文等重。 */",
			"[data-code-block-banner] [class*=\"_language_\"],",
			"[data-code-block-banner] [class*=\"_title_\"] {",
			"  font-size: 15px !important;",
			"  line-height: 22px !important;",
			"}",
			"html, body {",
			"  -webkit-font-smoothing: antialiased !important;",
			"  -moz-osx-font-smoothing: grayscale !important;",
			"  font-optical-sizing: auto !important;",
			"  /* 0.3px 伪加粗：补仿宋小字号笔画密度（Chatbox 同款） */",
			"  text-shadow: 0 0 0.3px currentColor !important;",
			"}",
			"/* 超长 markdown 表格（≥4列，全局类名 md-table-wide，挂在滚动容器上）：放弃横向滚动，强制压缩。",
			"   背景：官方 breakout 把容器撑到整个 transcript 宽度（100cqw, max-width:none），滚动条在 Firefox 下",
			"   走 scrollbar-width: thin + 暗色 thumb（#33406a），视觉隐形；实测无论 auto/scroll 都看不到条。",
			"   方案：容器宽度收进消息列并留 16px 呼吸（比 data-chat-flow 窄一点点），table width:100% 覆盖官方",
			"   max-content，table-layout:auto 让列宽按内容量比例分配，单元格 white-space:normal +",
			"   overflow-wrap:anywhere 强制断行——任何内容都物理上不溢出，也就不需要滚动条。 */",
			".md-table-wide {",
			"  box-sizing: border-box !important;",
			"  width: calc(100% - 16px) !important;",
			"  max-width: calc(100% - 16px) !important;",
			"  margin-left: 0 !important;",
			"  padding-left: 0 !important;",
			"  overflow-x: hidden !important;",
			"}",
			".md-table-wide table {",
			"  width: 100% !important;",
			"  max-width: 100% !important;",
			"  table-layout: auto !important;",
			"}",
			".md-table-wide th,",
			".md-table-wide td {",
			"  white-space: normal !important;",
			"  overflow-wrap: anywhere !important;",
			"}",
			"/* 暗色皮肤（furina/navia）下表格分割线对比度不足：",
			"   furina 皮肤重映射 --dsw-alias-border-l2: #2c3a7338 / --dsw-alias-border-l3: #2c3a7352",
			"   （深蓝+低透明度，暗底上几乎不可见）；navia 未重映射、官方默认值在暗底上同样偏暗。",
			"   官方表格边框：th 用 border-l3、td 用 border-l2（MarkdownText.module.css）。",
			"   这里按消息行范围（data-dsh-part=message-row，全局属性锚点，不受 CSS Module 哈希影响）",
			"   直接覆盖为半透明白：th 稍亮（表头层级）、td 稍暗；仅限这两个暗色皮肤，亮色皮肤不受影响。 */",
			"html[data-dsh-skin=\"furina\"] [data-dsh-part=\"message-row\"] table th,",
			"html[data-dsh-skin=\"navia\"] [data-dsh-part=\"message-row\"] table th {",
			"  border-bottom-color: rgb(255 255 255 / 0.35) !important;",
			"}",
			"html[data-dsh-skin=\"furina\"] [data-dsh-part=\"message-row\"] table td,",
			"html[data-dsh-skin=\"navia\"] [data-dsh-part=\"message-row\"] table td {",
			"  border-bottom-color: rgb(255 255 255 / 0.22) !important;",
			"}",
			"/* 会话标题集群居中（crumbs 居中 + headerActions 绝对左贴）—— 【2026-09-27 撤销】。",
			"   历史：本特性自 0.1.5 起存在；2026-09-26 随 0.1.7 从 data-dsh-responsive-part=session-title-cluster",
			"   换锚到 [data-slot=\"conversation.session.header\"] [class$=\"_titleCluster\"]（见 920523c）。",
			"   撤销原因：0.1.7 的 header 内新增「后台任务运行中」指示器后，居中的标题与绝对定位左贴的",
			"   headerActions（preset 标签 + 任务指示器）挤在同一行互相打架，观感反不如官方默认布局。",
			"   处理：两条规则整体删除，回归 ConversationRoot.module.css 默认 —— 官方 .titleCluster 本就",
			"   display:flex + align-items:center，补丁那两条声明冗余；position:relative 只为托住绝对子。",
			"   如需回滚：git show 920523c -- profiles/web/packages/dsh-sandrone-ui-patches/lib/client.js。 */",
			"/* crumb 限宽放开：官方 .crumb 有 max-width:220px + overflow:hidden + text-overflow:ellipsis",
			"   （ConversationRoot.module.css），超长标题（>220px）被截断成省略号。",
			"   放开限宽 + 允许换行，让标题完整显示；仍保留 padding/border-radius 观感。",
			"   crumbs 容器官方 overflow:hidden + nowrap——换行由 crumb 自身承担。",
			"   ⚠ 0.1.7 当前 crumb 由 <button disabled> 改成 <span>（darwin 拖拽行）：旧 nav button",
			"   结构选择器会漏掉当前 crumb；改用类名匹配并排除 Seg/Sep 包装。 */",
			"[data-slot=\"conversation.session.header\"] [class*=\"_crumb\"]:not([class*=\"_crumbSeg\"]):not([class*=\"_crumbSep\"]) {",
			"  max-width: none !important;",
			"  overflow: visible !important;",
			"  text-overflow: clip !important;",
			"  white-space: normal !important;",
			"  word-break: break-all !important;",
			"}"
		].join("\n");

		var tagId = "dsh-sandrone-ui-patches/ui.css";
		function injectFontCss() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") !== null) return;
			var tag = document.createElement("style");
			tag.dataset.plugin = "dsh-sandrone-ui-patches";
			tag.dataset.pluginCss = tagId;
			tag.textContent = FONT_CSS;
			document.head.appendChild(tag);
		}

		// cordis plugin shape: the loader calls apply() on the entry's exports.
		exports.apply = injectFontCss;
		// immediate injection (idempotent) — runs at materialization, before apply.
		injectFontCss();

		return module.exports;
	}
});
