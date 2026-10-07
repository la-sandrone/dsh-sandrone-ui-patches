# dsh-sandrone-ui-patches

DeepSeek Harness（DSH）的界面补丁集合 —— 以 **client 半区注入全局 CSS** 的方式，
在不改上游源码、不改 DOM 结构的前提下调整界面表现。

> **命名说明**：本地开发时叫 `dsh-suigintou-ui-patches`（水银灯），
> 公开发布用 `dsh-sandrone-ui-patches`（桑多涅）。**同一个包**，功能与代码完全相同。
> 差异只是早期注册时的命名习惯。

## 包含的补丁

| 补丁 | 内容 |
|---|---|
| **字体方案** | 正文字族 Source Serif 4 Display 打头 → Times New Roman / 中文仿宋 / 思源宋体兜底；<br>代码字族 **Fira Code → 仿宋 → serif**（与 VSCode 对齐） |
| **字号基准** | 正文 **18px**（改 `--dsh-content-font-size` 一处，h1–h4 与正文族**等比跟随**）；<br>代码块 / 行内代码 **16px**（小四） |
| **皮肤字族压制** | 两层通用规则压掉皮肤对 `code`/`pre` 的组件级直接声明（**不逐皮肤枚举**，新皮肤自动覆盖） |
| **表格** | 宽 Markdown 表格（≥4 列）强制压缩；furina/navia 暗色皮肤表格分割线对比度增强 |
| **长会话渲染剪枝** | `content-visibility: auto` —— 屏幕外消息跳过样式计算与布局（见下） |

字体选择是我的个人审美，因为总感觉无衬线体太丑了。

字族与字号均通过覆盖 DSH 的 CSS 变量树实现；皮肤压制另需选择器层（见 `lib/client.js` 注释）。

> **为什么代码字号要单独覆盖**：DSH 把 markdown 标题族全写成
> `calc(<原字号> + var(--dsh-content-font-delta))`，改基准一处即整体缩放；
> 但 `code`/`code-block` 是**硬编码绝对值**（12px / 11px），不参与该 delta 链——
> 所以放大正文后代码反而显得更小，必须显式覆盖。详见 `lib/client.js` 内注释。

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

MIT。`bench/katex/` 为上游 [KaTeX](https://katex.org/) 的发行副本（MIT），
随本项目一并分发以便基准测试离线复现。

其余文本内容采用CC BY-SA 4.0协议予以授权，条款参考 https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans 。

## 免责

本项目为第三方界面补丁，与 DeepSeek 官方无隶属关系。
界面注入类补丁会随上游 UI 变更而失锚，**升级 DSH 后请复验**。

