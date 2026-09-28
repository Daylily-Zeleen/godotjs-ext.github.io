# 安装

GodotJS-Ext 是一个 **GDExtension**。你不需要替换或重新编译 Godot 编辑器，
只要把扩展的 addons 目录放进你的工程即可。

## 1. 准备

- **Godot 4.7 或更高**。扩展的 `compatibility_minimum` 是 `4.7`，绑定的 godot-cpp 也按
  `API_VERSION = "4.7"` 生成；更旧的引擎会因 ABI 不匹配而加载失败。
- 解压工具（发布的包是 zip）。

## 2. 下载

从 [Releases](https://github.com/Daylily-Zeleen/GodotJS-Ext/releases) 下载。

发布包**按 JS 引擎切分**，每个包只包含该引擎真正构建的平台。包内是完整的
`addons/godotjs-ext.daylily-zeleen/` 目录（含 `bin/<platform>/` 下的二进制与一份
`godotjs-ext.gdextension`）。

| 引擎 | 资产名 | 包内平台 |
|---|---|---|
| V8（默认） | `godotjs-ext-v8-windows-linux-macos-android-ios.zip` | Windows、Linux（x86_64 + arm64）、macOS（arm64）、Android（arm64 + x86_64）、iOS（arm64） |
| QuickJS-NG | `godotjs-ext-qjs-ng-windows-linux-macos-android-ios-web.zip` | 同上，另加 Web（wasm32，带线程与不带线程） |
| JavaScriptCore | `godotjs-ext-jsc-macos-ios.zip` | macOS（arm64）、iOS（arm64） |
| Node.js | `godotjs-ext-node-windows-linux-macos.zip` | Windows、Linux（x86_64）、macOS（arm64） |
| 浏览器 | `godotjs-ext-web.zip` | Web（wasm32，带线程与不带线程） |

包内的 `.gdextension` 文件只声明**包内真实存在**的文件，可以直接用。

> [!NOTE]
> `godotjs-ext-web.zip` 只有浏览器引擎。编辑器本身仍需一个桌面引擎来加载扩展并导出 Web
> 工程，所以把这个包**解压覆盖**到你用的桌面引擎包之上（目录结构相同，会干净合并），
> 或者直接用 QuickJS-NG 包 —— 它本身已包含 QuickJS 的 web 构建。

原始 QuickJS 已被 QuickJS-NG 取代，不再出包；`use_quickjs=yes` 仍可本地构建。
选择依据见 [JS 引擎](/runtime/engines)。

## 3. 解压到工程

```bash
# 包顶层就是 addons/ ，直接解在工程根目录
unzip godotjs-ext-v8-windows-linux-macos-android-ios.zip -d /path/to/your/project
```

结果：

```
your-project/
└── addons/
    └── godotjs-ext.daylily-zeleen/
        ├── godotjs-ext.gdextension
        ├── icons/GodotJSScript.svg
        └── bin/<platform>/...
```

## 4. 让 Godot 加载扩展

打开工程。如果扩展没有被自动加载，在 **项目 → 项目设置 → 插件** 里确认 GDExtension 已列出，
或者直接检查 `project.godot`：

```ini
[gdextensions]

paths=["res://addons/godotjs-ext.daylily-zeleen/godotjs-ext.gdextension"]
```

Godot 4 会在打开工程时扫描 `addons/*.gdextension`；如果没扫到，重启编辑器即可。

## 5. 确认加载成功

编辑器底部会出现 **GodotJS** 面板（REPL 与 Statistics 两个页签）。看到它就说明运行时起来了。

## 与上游 GodotJS 的区别

上游的安装文档让你**下载一个自带 GodotJS 的 Godot 编辑器可执行文件**并把它加到 PATH。
本仓不发布引擎二进制，所以那条路径不适用：装的是扩展，编辑器用你原有的。

## 下一步

[工程配置](/guide/project-setup)：安装预设文件、拉起 TypeScript 工具链。
