---
title: GodotJS-Ext
---

# GodotJS-Ext

**为 Godot 4.7+ 提供 TypeScript / JavaScript 脚本支持，以 GDExtension 形态交付。**

GodotJS-Ext 让你像写普通脚本一样写 TypeScript：类继承 Godot 对象、`_ready()` 里跑代码、
在检查器里看到导出的属性、在 Chrome 或 VS Code 里下断点。区别在于它是**一个 GDExtension 扩展**，
装进任何 Godot 4.7+ 工程即可，不要求替换引擎本体。

<HomeCards />

## 要求

| | |
|---|---|
| Godot | **4.7 或更高**。扩展的 `compatibility_minimum` 是 `4.7`，godot-cpp 绑定按 `API_VERSION = "4.7"` 生成；更旧的引擎因 ABI 不匹配加载不了。 |
| 平台 | Windows / Linux / macOS（桌面）、Android、iOS、Web。具体组合见 [JS 引擎](/runtime/engines)。 |
| 可选 | TypeScript 工程需要 Node.js 与包管理器（用于编译 `.ts`）。纯 JavaScript 项目不需要。 |

> [!IMPORTANT]
> GodotJS-Ext 只发布 **addons 包**，不发布自带插件的 Godot 编辑器。
> 用你已有的 Godot 4.7+ 编辑器即可。

## 快速开始

```bash
# 1. 从 Releases 取与你引擎/平台匹配的包，解压到工程根目录
#    （包内是 addons/godotjs-ext.daylily-zeleen/ 的完整目录）
unzip godotjs-ext-v8-windows-linux-macos-android-ios.zip -d /path/to/your/project

# 2. 打开工程，GodotJS 底部面板 → Install Preset Files
# 3. 装好 TS 工具链并编译
cd /path/to/your/project
pnpm install
npx tsc
```

细节见[安装](/guide/installation)与[工程配置](/guide/project-setup)。

## 功能

- Godot `ScriptLanguage` 集成：脚本类、热重载、编辑器内运行
- 多引擎：V8（默认）、QuickJS-NG、JavaScriptCore、Node.js、浏览器宿主 JS
- 编辑器内 REPL 与运行时统计面板
- 源码注释即可成为编辑器里的脚本文档
- 生成式类型提示：场景节点、资源类型、`ResourceLoader.load()` 的返回类型
- 静态绑定：可选 `binding_mode=static|shared|dynamic`
- Worker 与 ShadowRealm（实验性）
- 与 GDScript 互操作：`@tool`、导出属性、信号、静态成员

## 与上游 GodotJS 的关系

GodotJS-Ext 源自 [godotjs/GodotJS](https://github.com/godotjs/GodotJS)，但分发形态与实现都已分叉：
上游是**引擎模块**（要自己编译引擎），本仓是 **GDExtension**（装进现有编辑器）。
引擎支持、构建流程、编辑器菜单、发布方式都不同。逐条对照见[与上游 GodotJS 的差异](/misc/differences)。

## 许可

仓库根 `LICENSE` 为 **GNU LGPL 2.1**。`third/` 下的第三方组件各自沿用其上游许可。
