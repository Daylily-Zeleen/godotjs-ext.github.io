# JS 引擎

GodotJS-Ext 支持多种 JavaScript 引擎。装的是哪个引擎取决于你下载的发布包 —— 它在**构建时**确定，
运行时不可切换（`godot-jsb` 的 `impl` 告诉你是哪一个）。

## 引擎与发布包

| 引擎 | scons 选择 | 是否出包 | 平台覆盖 |
|---|---|---|---|
| **V8**（默认） | 不加引擎标志 | `v8` | Windows、Linux（x86_64 + arm64）、macOS（arm64）、Android（arm64 + x86_64）、iOS（arm64） |
| **QuickJS-NG** | `use_quickjs_ng=yes` | `qjs-ng` | 覆盖面最广：上面的全集，另加 Web（wasm32，带线程与不带线程） |
| **JavaScriptCore** | `use_jsc=yes` | `jsc` | 仅 macOS（arm64）与 iOS（arm64） |
| **Node.js** | `use_node=yes` | `node` | 仅桌面：Windows、Linux（x86_64）、macOS（arm64） |
| **浏览器宿主 JS** | `platform=web` 且不加引擎标志 | `web` | 仅 Web（wasm32） |
| QuickJS（原始） | `use_quickjs=yes` | ❌ 不出包 | 仅本地构建 |

- 发布的包名体现平台：`godotjs-ext-v8-windows-linux-macos-android-ios.zip` 等，见[安装](/guide/installation)。
- **原始 QuickJS 已被 QuickJS-NG 取代**，CI 不再构建它，也不出包；`use_quickjs=yes` 仍然可以本地编。
- `web` 不是 `v8`：`platform=web` 且不带引擎标志时，构建出的必然是**浏览器宿主 JS**
  （`JSB_WITH_WEB`），因为 v8 没有 web 预编译库。发布归属上它是独立的包。

> [!NOTE]
> 各引擎的功能略有差异。例如 `godot.worker.d.ts` / ShadowRealm 在**纯 Web 构建**里不安装，
> 因为浏览器宿主环境没有对应的线程/隔离机制。

## 各引擎的取舍

| | 优势 | 代价 |
|---|---|---|
| **V8** | 性能最好、调试体验最好（Chrome DevTools / VS Code 断点）、生态最成熟 | 二进制体积大；依赖预编译的 V8 归档 |
| **QuickJS-NG** | 体积小、平台覆盖最广（含 Web）、纯 C 源码易交叉编译 | 执行速度低于 V8；无 Chrome 调试器 |
| **JavaScriptCore** | Apple 平台原生，无需额外依赖 | 仅 macOS/iOS；调试走 Safari |
| **Node.js** | 内置 libnode，能用 Node 生态（例如 Node 的模块解析） | 仅桌面；依赖 libnode 预编译归档 |
| **浏览器宿主 JS** | 不额外塞引擎进 wasm 包 | 只在 Web 上有；受宿主浏览器能力限制 |

## 在构建时选择

```bash
# V8（默认）
scons platform=windows target=editor -j10

# QuickJS-NG
scons platform=windows target=editor use_quickjs_ng=yes -j10

# JavaScriptCore（需要 Apple 平台）
scons platform=macos target=editor use_jsc=yes -j10

# Node.js
scons platform=windows target=editor use_node=yes -j10

# 浏览器宿主 JS（Web 平台，不加引擎标志）
scons platform=web target=template_release -j10
```

`use_node=yes` 隐含 `use_v8`（libnode 内嵌 V8），但会改用 libnode 而不链接独立的 V8 单体库。
`use_jsc` / `use_quickjs*` / `use_node` 有优先级关系，实际生效的引擎在构建日志里会打印一行
`javascript engine: ...`。

选择依据（`release-packaging.md`）：**要改「哪个引擎支持哪些平台」，只改 CI 构建矩阵**；
发布脚本 `misc/release/package.py` 与门禁都从同一份矩阵派生，不会出现"门禁绿但包里缺平台"。

## 运行时探测

```ts
import * as jsb from "godot-jsb";

console.log(jsb.impl);                       // "v8" / "quickjs" / "node" / ...
console.log(jsb.BINDING_MODE);               // "static" | "shared" | "dynamic"
console.log(jsb.BIGINT_FOR_64BIT);           // 64 位整数是否以 BigInt 返回
console.log(jsb.CAMEL_CASE_BINDINGS_ENABLED);
```

## 相关

- [安装](/guide/installation)
- [从源码构建](/guide/project-setup)
