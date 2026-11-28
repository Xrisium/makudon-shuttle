# 连接原理与 USB 方案比较

## 共同目标

各通道只负责把一个 ZIP 完整送到另一端。发现负责找对端，配对负责允许谁连接，传输负责送字节和保存回执；导入和冲突是接收文件后的本地操作。这里没有持续同步、自动合并或删除传播。

应用协议不应关心下方是 Wi-Fi、网线、USB 网卡还是蓝牙。LAN 与 USB 网络共享 TCP 实现；RFCOMM 和可能的 AOA 用独立字节流适配。标准 TLS 保护传输，ZIP 本身仍为普通明文文件。

## LAN 的工作过程

### 地址、端口与字节流

电脑连网线、手机连同一路由器 Wi-Fi 时，也可能处于同一个 LAN。双方不必都用 Wi-Fi，不需要互联网，但必须能相互到达。电脑打开监听端口，手机主动连接电脑 IP 和端口；TCP 提供有序、可靠的双向字节流，双方都能发 ZIP，“连接发起方”不等于“唯一发送方”。

TCP 不保留应用消息边界，一次读不一定拿到完整头或整块数据。因此需要长度前缀、消息类型、文件大小、分块、背压与取消；接收完成后关闭、核对 SHA-256 并发保存回执。TCP 的可靠传输不能替代磁盘保存确认。

### 发现与手动地址

DNS-SD 描述服务类型、实例名、端口等，mDNS 在本地网络帮助发现，无须自建服务器。PC 按需发布服务，Android NsdManager 发现，再建立 TCP。它只找地址，不证明身份。[Android NSD](https://developer.android.com/develop/connectivity/wifi/use-nsd)

手动输入 IP / 端口或扫描邀请可以绕过发现被挡的问题，不能绕过防火墙、访客网络隔离、VLAN 或 AP 客户端隔离。热点可形成局域网，但应单独验证；同一 Wi-Fi 名称不保证两端可达。

### TLS 与配对

在 TCP 上先建立标准 TLS，再按限时邀请和保存的设备身份授权。自签名身份需要绑定公钥 / 证书，不能全局关闭验证。配对邀请不能从公开广播中直接当信任源；二维码或人工核对是带外建立信任的手段。手机最低 API 26，需要验证与桌面 TLS 1.2 / 1.3 的共同能力。

Windows 首版只在选定网卡按需监听，不默认绑定全部网卡，不自动提权修改防火墙。程序不借网络权限访问云服务。Android 当前 target 36 与未来升级后的局域网保护不同，实施时按目标 SDK 和系统版本检查 NSD、手动地址及拒绝 / 撤销行为。[Android 局域网权限](https://developer.android.com/privacy-and-security/local-network-permission)

## 蓝牙的工作过程

### Classic RFCOMM

RFCOMM 可以理解为蓝牙提供的一条有序串行字节通道。服务端用双方约定的服务 UUID 登记服务，另一端查找并连接；Android BluetoothSocket 的输入 / 输出流用于收发，双方 UUID 要一致。[Android RFCOMM](https://developer.android.com/develop/connectivity/bluetooth/connect-bluetooth-devices)

Windows 计划验证 Win32 Winsock AF_BTH / RFCOMM，避免直接假定 UWP capability 示例适用于未打包单 EXE。系统蓝牙配对负责链路身份与权限，应用配对负责本工具授权。首版优先已在系统配对的设备，减少扫描和可发现状态。

RFCOMM 不是 TCP/IP，也没有 IP 地址 / TCP 端口，但上层仍可复用同一 ZIP 分块、取消和回执。TLS 在它上面需要传输无关封装；Android SSLEngine 的握手、碎片与关闭要另做验证，不能把 SSLSocket 的 TCP 接法直接照搬。

蓝牙主要价值是离线、无需路由器；原图较多的大包会慢，吞吐依适配器、距离与干扰而变。不要预先承诺固定速度。必须关闭 Wi-Fi 后完成测试，不能把“蓝牙找设备、实际用 Wi-Fi 传”算蓝牙通道。

### BLE 的区别

BLE 常用 GATT 的服务 / 特征值读写和通知，不天然等于任意长文件流。大文件需额外分片、协商 MTU、流控和重试，不把 BLE 等同 Classic。暂用 RFCOMM，BLE 只作为将来可能的发现 / 引导候选。

Android 12+ 按职责请求 CONNECT / SCAN / ADVERTISE，旧系统按真实扫描路径处理位置相关权限；不为“可能用到”一次申请全部。权限拒绝不影响离线 ZIP。[Android 蓝牙权限](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)

## USB 网络的工作过程

电脑是 USB host，手机在系统开启 USB 网络共享后暴露网络接口。驱动将其表现为网卡，两端拥有可达的网络地址，之后和 LAN 一样运行 TCP → TLS → ZIP 协议。RNDIS / NCM 是可能涉及的设备网络方式，不是应用可以强制所有手机提供的统一模式。

“共享网络”的系统名称不等于本工具一定要访问互联网：只要直连地址可达，ZIP 可只走本地 USB 链路。但部分手机启用条件和驱动受系统 / 厂商策略影响，应实测关闭 Wi-Fi 和不必要移动数据后的可用性。

USB 网络的优点：复用已做的 LAN 代码，应用级改动少，通常不需要 ADB；限制是用户要插数据线、解锁、开启系统选项，PC 可能需驱动识别，防火墙仍可能作用于新网卡。普通应用不能保证静默打开系统 USB 共享。

## 插线应用直连的 AOA 路线

AOA 让 PC 作为附件 host，手机进入 Android Accessory 模式。PC 检测支持、发送标识控制请求、请求切换，设备可能重新枚举，PC 再找到 bulk 端点；手机通过 UsbManager / UsbAccessory 获取文件描述符。ZIP 走端点流，不依赖 IP 或网络共享。[Android Accessory](https://developer.android.com/develop/connectivity/usb/accessory)、[AOA 协议](https://source.android.com/docs/core/interaction/accessories/aoa)

这里的“插线即可”是完成必要的首次配置和授权后的体验，不应承诺所有手机首次插线零点击。可能仍需解锁、系统附件授权和选择打开应用；并非每台 Android 都具备相同支持。

### 相比 USB 网络新增的工作

| 工作 | 需要解决的问题 |
| --- | --- |
| PC 原始 USB 接入 | 初始设备识别、控制请求、模式切换、超时与重枚举 |
| Windows 驱动 | 切换前 / 后的接口是否能被应用打开，WinUSB / 其他绑定如何分发 |
| 手机附件接入 | Manifest feature / accessory filter、附着事件、授权与文件描述符生命周期 |
| 流与安全 | bulk 短读 / 短写、拔线、背压、TLS 流封装及 ZIP 回执 |
| 硬件兼容 | 各手机模式、数据线、USB 端口、休眠、重复插拔及 MTP 共存影响 |
| 交付方式 | 若需安装驱动或管理员权限，如何与免安装单 EXE 目标协调 |

WinUSB 是系统提供的驱动，但自动绑定有描述符等条件；“系统带 WinUSB”不等于任意 Android 模式自动免驱可打开。若目标设备需手工换驱动或 INF 安装，应明确记录，不能把开发机工具配置包装成普通用户零配置。[Microsoft WinUSB 安装条件](https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/winusb-installation)

现成手机的 USB 描述符和可用模式通常由系统 / 厂商实现决定，不是安装一个普通 Android 应用就能任意修改。尤其要核实切换前怎样访问设备，不能只验证进入 Accessory 后的端点；整体替换驱动还可能影响既有 MTP 等功能。用户不考虑应用发布签名，不代表可以绕过系统对驱动包的要求。

如果方案要求驱动包签名或分发身份，与当前“不购买签名、不引入安装器”的产品边界冲突，就不能直接纳入。不要自动运行换驱动工具或替换用户现有驱动。

### 两条有线路线比较

| 维度 | USB 网络 | AOA 应用直连 |
| --- | --- | --- |
| 用户日常操作 | 插线后开系统 USB 网络选项 | 理想为插线触发连接，首次仍可能授权 |
| PC 看到的对象 | 网卡和 IP 地址 | USB 接口与 bulk 端点 |
| 现有代码复用 | 直接复用 LAN | 复用文件协议，另做 USB 与 TLS 流适配 |
| 防火墙 | 仍需处理 | 不走 IP，通常无 TCP 防火墙路径 |
| 驱动 | 网络设备驱动，依机型 | 初始 / Accessory 驱动访问与绑定，风险更集中 |
| 手机新增 | 同 LAN 传输，通常不用 USB 数据 API | 增加附件发现、授权和流管理 |
| 跨平台 | 协议可复用，网络驱动各平台验证 | 原始 USB 和权限各平台适配 |
| 当前建议 | 作为后续有线首选 | 先保留研究任务，原型证据决定 |

这两条路线都不能保证某种固定速度；网络 USB 也可能很快，AOA 不天然更快。连接体验和驱动维护是主要取舍。

## MTP 与 ADB 的位置

MTP 是系统公开共享存储文件的方式，不提供 Makudon 私有 filesDir。可以先导出 ZIP，再用资源管理器复制，之后手机手动选 ZIP 导入；这不需要开发在线传输，但不属于配对直连。

ADB 能做开发端口转发，但要求调试授权，不作为用户正式通道，也不随产品分发。测试 USB 网络时不能让 ADB 转发悄悄代替实际链路。

## 待验证任务

- [ ] LAN 在 Win10 普通账户、无互联网、防火墙拒绝和多网卡下行为明确。
- [ ] 目标手机 USB 网络无需 Wi-Fi 仍可互达，确认所需驱动和系统操作。
- [ ] RFCOMM 真机互通及 TLS 流适配，权限拒绝不影响其他能力。
- [ ] 若研究 AOA，先记录初始 / 切换后驱动和授权，再决定是否符合免安装目标。
- [ ] 每条通道保存相同 ZIP 的摘要往返证据，断线不覆盖、不隐式导入。
