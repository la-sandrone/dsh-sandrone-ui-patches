# dsh-sandrone-ui-patches

DeepSeek Harness（DSH）的界面补丁集合 —— 以 **client 半区注入全局 CSS** 的方式，
在不改上游源码、不改 DOM 结构的前提下调整界面表现。

> **命名说明**：本地开发时叫 `dsh-suigintou-ui-patches`（水银灯），
> 公开发布用 `dsh-sandrone-ui-patches`（桑多涅）。**同一个包**，功能与代码完全相同。
> 差异只是早期注册时的命名习惯。

## 包含的补丁

| 补丁 | 内容 |
|---|---|
| **字体方案** | 正文字族 **Source Serif 4 Variable**（随包自带，`@font-face`）打头 → Source Serif 4 Display / Times New Roman / 中文仿宋 / 思源宋体兜底；<br>代码字族 **Fira Code → 仿宋 → serif**（与 VSCode 对齐） |
| **字号倍率** | **不设死基准** —— 跟随 DSH 设置面板的「字号大小」（10–22px），正文基准由用户决定；<br>本补丁只定义**倍率**（代码 = 基准 × 16/18、行内代码同、小字号行高 × 24/18、横幅 × 15/18 等），基准一动整站等比跟随 |
| **随包字体** | `font/SourceSerif4Variable-Roman.woff2`（全量 426,716 B，**SIL OFL 1.1**），由 host 半区的前缀路由发出（`immutable` 缓存 + 内容哈希 ETag）；<br>保留可变轴 `wght 200-900` / `opsz 8-60`，故 `font-optical-sizing: auto` 能**按实际字号自动选光学尺寸** |
| **皮肤字族压制** | 两层通用规则压掉皮肤对 `code`/`pre` 的组件级直接声明（**不逐皮肤枚举**，新皮肤自动覆盖） |
| **表格** | 宽 Markdown 表格（≥4 列）强制压缩；furina/navia 暗色皮肤表格分割线对比度增强 |
| **长会话渲染剪枝** | `content-visibility: auto` —— 屏幕外消息跳过样式计算与布局（见下） |

字体选择是我的个人审美，因为总感觉无衬线体太丑了。

字族与字号均通过覆盖 DSH 的 CSS 变量树实现；皮肤压制另需选择器层（见 `lib/client.js` 注释）。

> **关于官方的字号链，以及本补丁接管哪几档**：DSH 把 markdown 标题族写成
> `calc(<原字号> + var(--dsh-content-font-delta))`（加法式，基准由 `--dsh-content-font-size` 派生）；
> 而 `code` / `code-block` / 横幅是**硬编码绝对值**（12px / 11px / 11px），**不在这条链上**。
> 本补丁**不动**官方的基准与 delta 链 —— 早期版本曾用 `18px !important` 覆盖基准值，
> 那会压掉设置面板（`!important` 赢过写在 body 内联样式上的用户设置），**已撤销**；
> 现在只在链外接管这几档，并统一写成**倍率 × 基准**的形式。详见 `lib/client.js` 内注释。
> （可变字体的 `opsz` 轴也正因「基准可调」才必需：手工分档是静态映射，字号一变就失配。）

## 长会话渲染剪枝

DSH 的消息列表**既无虚拟化、也无 `content-visibility`**，长会话下 style + layout
会随 DOM 节点数线性增长。实测（真实会话，186 条消息 / **30,181 个 DOM 节点**）：

| 环境 | `content-visibility: off` | `auto` | 收益 |
|---|---|---|---|
| Firefox 157 | 219 ms | **39 ms** | **−82%** |
| Edge 154 | 240 ms | **0.8 ms** | **−99.7%** |

完整方法、全部原始读数、复现步骤与**局限声明**见：

> ### 📄 [`docs/perf-long-session-rendering.md`](docs/perf-long-session-rendering.md)

该报告同时记录了一条方法学教训（**`--headless` 不能用来测 layout**，
实测高估 4.5 倍），复现材料在 [`bench/`](bench/)。

## 安装

```bash
# 在 DSH profile 目录下
pnpm add file:packages/dsh-sandrone-ui-patches
```

或作为 bundle 挂载（见 `cordis.patch.yml`）。

## 兼容性

`dsh.engines.dsh >= 0.1.1-rc.1`

## 许可

MIT。

随包字体 `font/SourceSerif4Variable-Roman.woff2` 是
[Source Serif 4](https://github.com/adobe-fonts/source-serif)（Adobe）的发行副本，
采用 **SIL Open Font License 1.1**；许可全文随包附于 `font/LICENSE-SourceSerif4.md`（OFL 要求随附）。

`bench/katex/` 为上游 [KaTeX](https://katex.org/) 的发行副本（MIT），
随本项目一并分发以便基准测试离线复现。

其余文本内容采用CC BY-SA 4.0协议予以授权，条款参考 https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans 。

## 免责

本项目为第三方界面补丁，与 DeepSeek 官方无隶属关系。
界面注入类补丁会随上游 UI 变更而失锚，**升级 DSH 后请复验**。
