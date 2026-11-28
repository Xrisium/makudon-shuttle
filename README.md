<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/makudon-shuttle-lockup-dark.svg">
    <img src="assets/readme/makudon-shuttle-lockup-light.svg" alt="Makudon Shuttle" width="480">
  </picture>
</h1>

Makudon 的 PC 文稿库 ZIP 交换工具。将手机导出的备份带到电脑，或把电脑上的文稿打包后送回 Makudon，继续使用熟悉的 ZIP 导入与恢复方式。

**免费开源、本地优先，无需账户。** 面向 Windows 10 x64，目标以单 EXE 免安装运行。设置使用 Windows 用户配置目录，文稿和备份保存在你选择的工作目录中。

> 当前尚无可下载运行的版本。以下是产品设计，功能可用性以正式发布为准。

## 功能

- **普通 ZIP，自由带走**：沿用 Makudon 文稿库格式，保留文稿、目录和原图。
- **电脑整理，手机继续写**：检查 ZIP、打包文稿目录，或解压到选定位置。
- **本地互传**：通过局域网发送与接收 ZIP，数据线与蓝牙作为后续连接方式。
- **熟悉的界面**：延续 Makudon 的柔和配色、圆角、分组布局和简洁操作。

Shuttle 负责文件交换；导入模式、冲突和覆盖确认由手机 Makudon 处理。收到文件不会自动改变手机文稿库。

## 备份范围

与 Makudon 自带 ZIP 一致：当前文稿、目录和受支持图片，不包含设置、回收站、本地快照或完整文稿身份元数据。ZIP 不加口令，局域网传输使用标准 TLS。

## 相关资料

- [Makudon](https://github.com/Xrisium/makudon)
- [文档索引与开发资料](docs/README.md)
- [品牌标志与使用规范](assets/brand/README.md)
- [MIT 许可](LICENSE)
- [第三方素材](THIRD_PARTY_NOTICES.md)
