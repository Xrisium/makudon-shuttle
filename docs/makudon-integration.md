# Makudon 需要的配合改动

## 接入原则

手机本地维护文稿库，Shuttle 只发送与接收 ZIP。传输协议不包含编辑器、节点树、恢复模式、冲突或快照。两端不共享源码、不依赖对方的本地工程路径；公开 ZIP 和文件传输协议是全部契约。

## 当前源码入口

以下均位于 Makudon app/src/main/kotlin/io/github/xrisium/makudon 下。

| 文件 | 已有能力 | 接入方式 |
| --- | --- | --- |
| feature/workspace/BackupCoordinator.kt | prepareExport、生成校验 ZIP、chooseExport、read(Uri)、恢复 UI 和取消 | 保留本地流程，只增加必要文件交接 |
| feature/workspace/FileExchange.kt | archive(name, file, closed)、保存 / 分享；ImportKind.Archive 文件选择 | 新增本地“发送到电脑”输出入口，复用原导入 |
| data/ExportFiles.kt | 分享输出的独立文件副本 | 可利用其只读副本思想，明确租约和清理 |
| data/LibraryArchive.kt | 纯 ZIP、安全检查、图片路径转换及导出回读 | 格式不变 |
| data/LibraryController.kt | 候选库、基线与整库切换 | 不因文件传送改事务 / 指针 |
| MainActivity.kt / AndroidManifest.xml | 现有 VIEW 只接文本 MIME，无网络 / 蓝牙权限 | 不应假定已有“外部点 ZIP 直接恢复” |

## 离线版需要什么

如果 PC 只处理已有 ZIP、用户经任意方式复制，Makudon 可完全不改：照常导出，电脑处理，照常在手机“备份与恢复”选 ZIP。

当前能分享 ZIP 不等于已有手机内置 LAN 收发，也不等于系统能将任意 ZIP VIEW 路由到恢复页。

## LAN 最小新增范围

### 文件传输页

在数据管理中增加“文件传输 / 连接电脑”，显示连接、待收文件、选择已有 ZIP 发送、进度、取消和本次结果。独立持有收发任务，不把 socket 放入 Compose 组件。初版要求页面前台，不承诺锁屏后台继续。

### 本地发出

先支持选择已有 ZIP：SAF 给只读 URI，读取元信息并有界流式发送；源 URI 不改变。即使它不是 Makudon 生成的 ZIP，传输也不应改写其内容。

便捷入口“导出并发送”由手机用户主动触发：沿用保存屏障、名称冲突预览、ZIP 生成和回读校验，再将只读材料交给文件传输。导出失败不启动发送。

当前 FileExchange 已有输出副本和分享租约。可以为传输建立独立、受控的只读租约或副本，不让 BackupCoordinator 过早清理源文件。慢速发送不持有编辑器 IO Mutex；生成完成后应能返回编辑。不要为了方便把网络任务塞进库提交临界区。

### 本地收到

用户确认文件名、大小和位置后接收，按任务 ID 暂存、核对完整摘要并发布。可以先选择 SAF 保存位置；如果 provider 不支持原子发布，须明确其失败和半成品语义，不伪报成功。

内部受控收件材料可短暂保存在任务私有目录，并通过非导出的 ContentProvider / 现有 FileProvider 生成只读 content URI；用户点击“导入文稿库”才转入 BackupCoordinator.read 的既有预览。必须定义来源租约，避免接收页退出就删除导入正在读取的文件。

如果用户只选择保存，不自动进入恢复。未导入的持久收件须有可见记录、容量与删除入口，不能作为无界、不可见缓存。导入后是否保留外部 ZIP 由用户文件管理决定，不因恢复成功自动删除源文件。

### 权限、发现与生命周期

LAN 新增 INTERNET，NsdManager / socket 和 TLS，按目标 SDK 处理局域网权限；网络状态权限只在真实需要时加。不加入广泛存储权限、云服务、遥测或远程正文读取。

连接邀请在手机侧确认，拒绝或撤销不影响编辑和离线导入。任务拥有明确的取消与退出行为；进程死亡后不假装仍连接，可通过持久传输元数据辨认完成 / 失败 / 待核实。

## 可以后加的部分

- 通过系统 ACTION_SEND 接收任意应用分享来的 ZIP，再进入传输待发列表，不自动恢复。
- 外部 ZIP 的 ACTION_VIEW 导入关联，需单独处理 MIME、临时 URI 授权和重复 Intent。
- 后台传输的前台服务与通知，按系统版本独立设计。
- USB 网络通常复用 LAN，无需 UsbManager 读写 ZIP；RFCOMM 另加蓝牙权限与流适配；AOA 另加附件生命周期。

## 不再需要的旧方案改动

不提取远程管理整库的门面，不发布远程恢复 API，不传恢复计划，不改 LibraryController 指针登记远程提交 ID，不让 PC 查询手机导入结果。应用间只有文件收件结果，库恢复继续是本地动作。

## 环境与验证

开发环境引用 Makudon docs/development.md、.local/android.json、scripts/android.ps1 当前配置。已核对 JDK 17、SDK 36、AVD Android_API_36，不新增一套环境。设备策略引用 docs/device-policy.md，真机每次重识别，模拟器优先；本轮未操作设备或修改手机代码。

- [ ] 原有 ZIP 导入 / 导出、三种模式、冲突和图片回归不改变。
- [ ] 收发原字节摘要一致，源 URI 和手机库不因传输改变。
- [ ] 收到文件不自动导入，用户主动导入后才调用原流程。
- [ ] 导出交接不被清理抢先删除，传输不长时间冻结编辑器。
- [ ] 断网、取消、权限拒绝、空间不足、强杀和重复请求不假成功。
- [ ] 不运行 Shuttle 时，手机全部既有离线功能仍然可用。
