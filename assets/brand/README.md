# Makudon Shuttle 品牌标志

![图标与文字组合](../readme/makudon-shuttle-lockup-light.svg#gh-light-mode-only)
![图标与文字组合](../readme/makudon-shuttle-lockup-dark.svg#gh-dark-mode-only)

沿用 Makudon 的 Fredoka Semibold 字标规范，与 Shuttle 自己的主图标组合。主图标中的 M 与纸飞机保持原始路径、线宽和圆端点；不拿 Makudon 手机应用图标替代 Shuttle 图标。

## 资源

| 文件 | 用途 |
| --- | --- |
| [makudon-shuttle-icon.svg](makudon-shuttle-icon.svg) | 独立图标；保留原始 105 × 100 画布，透明背景，可着色 |
| [makudon-shuttle-wordmark.svg](makudon-shuttle-wordmark.svg) | 独立路径字标，完整产品名 Makudon Shuttle |
| [makudon-shuttle-lockup.svg](makudon-shuttle-lockup.svg) | 图标在左、文字在右的标准横向组合 |
| [source/makudon-shuttle-icon.svg](source/makudon-shuttle-icon.svg) | 根目录原 SVG 原样迁入，原名 makudon-shuttle-a-refined-icon.svg；字节和 #222222 原色未变 |
| [浅色展示版](../readme/makudon-shuttle-lockup-light.svg)、[深色展示版](../readme/makudon-shuttle-lockup-dark.svg) | README 等图片引用场景，分别固定为 #272827 / #E0E3DD |
| [preview.png](preview.png) | 浅深色、独立资源与界面位置的视觉参考；不是已实现的软件截图 |
| [provenance.json](provenance.json) | 固定来源、哈希、字体参数、生成工具与资源状态 |

三个正式资源使用 `currentColor`，仅含矢量路径、分组变换及可访问名称，无 `<text>`、字体引用、内嵌字体、图片、脚本或外部依赖。独立图标保留原始画布；字标采用紧边界，组合标志自行带少量上下对齐空间，安全留白由使用位置提供。

## 字形与比例

- 真实 Fredoka 可变字体，`wght=600`（Semibold）、`wdth=100`。与 Makudon 使用相同的 Google Fonts 固定提交和原文件哈希。
- HarfBuzz 完成 shaping 与 kerning；每个字符增加 4 个字体单位的微小字距，64px em 下为 0.256px。使用字体原有空格和字形，不横向压缩、不描边加粗、不改字符造型。
- 字标以 64 单位 em 生成，可视尺寸约 481.248 × 47.296；横向组合约 569.288 × 56。图标可视宽 72.04，图标到字标可视边界间距 16。图标与字标按可视边界垂直居中。
- 四周安全留白至少为小写字高的一半，64 单位 em 下取 16；不得把这个留白算进相邻按钮热区。保持宽高比，不能拆开重新排字或自动换行。
- 单色跟随主题主文字色；五套主题分别使用 #272827、#39312A、#29373D、#303B2D、#E0E3DD。背景保持透明，不添加彩色强调、阴影或额外徽章。

## 软件中的使用位置

当前仓库没有原生应用代码；以下是实施约定，[预览图](preview.png)只展示放置方式。

| 位置 | 使用方式 |
| --- | --- |
| 宽侧栏顶部 | 横向组合宽 220–248 逻辑单位，四周至少 16；与下方导航留出 24。侧栏不足以容纳时只用图标，不挤压字标 |
| 底栏方案的主页面顶部 | 有空间时使用完整组合；与文件页标题职责合并，避免产品名重复出现。窄窗口直接保留页面标题 |
| 设置 → 关于 | 居中完整组合，宽约 320；窄窗口随容器缩放。版本与相关链接置于下方，读屏名称为 Makudon Shuttle |
| 窗口 / 任务栏 / 可执行文件图标 | 仅用图形；未来按平台生成方形画布与 ICO，等比居中、不拉伸、不裁掉原始留白。当前未生成发布图标 |
| 文件清单、预览、传输进度、对话框 | 内容和操作优先，不重复放大品牌标志，不用 Logo 代替功能图标 |

完整组合建议宽度不小于 220，独立字标不小于 184，独立图标建议至少 24 × 23 逻辑单位；16px 系统图标需要后续专项像素验收。应用标题栏文字仍是可访问的系统文本。商标图片提供产品名语义，相邻已存在相同名称时作为装饰，避免读屏重复播报。

SVG 通过 `<img>` 或纹理加载时，外部 `color` 通常不能传进 SVG。原生集成须按主题给路径着色，或以确定色值栅格化，并在主题 / DPI 切换时更新缓存；不得直接把默认黑色图片放在夜墨背景。README 使用固定浅深色派生文件。

Fredoka 仅是设计输入。应用资源与发布包只需要路径或由路径生成的图像，**不嵌入 Fredoka，也不在运行时访问字体服务**。UI 和正文仍遵守项目原有字体约定。

## 来源与再生成

参考 Makudon 本地仓库的 `assets/brand/README.md`、`provenance.json`、`docs/design.md`，及 Codex 聊天“讨论界面风格与美术设计”。[Fredoka 官方页面](https://fonts.google.com/specimen/Fredoka)，版权与完整许可保存在 [fredoka-OFL.txt](../../docs/licenses/fredoka-OFL.txt)；设计输入不随项目提交。

使用 fontTools 4.67.0、uharfbuzz 0.57.0 的设计环境，从 provenance 中固定的上游 URL 获取字体后运行：

```powershell
python scripts/generate-brand.py --font 'C:/design-inputs/Fredoka[wdth,wght].ttf'
```

脚本校验字体和许可哈希，生成三个主资源、两个 README 派生文件与来源记录，不保存中间字体。生成预览可在已有 sharp 的设计环境运行 `node scripts/preview-brand.cjs`；它不属于应用依赖。
