# 与上游 GodotJS 的差异

GodotJS-Ext 的起点是 [godotjs/GodotJS](https://github.com/godotjs/GodotJS)。
上游仓库里的 JS/TS 运行时、编辑器插件、注解体系都源自那里，很多 API 文档仍然适用；
但**分发形态与实现已经分叉**，照搬上游文档会在若干处踩坑。本页逐条列出差异。

## 一句话总结

| | 上游 GodotJS | GodotJS-Ext（本仓） |
|---|---|---|
| 形态 | **引擎模块**（作为 Godot 源码树的一部分编译） | **GDExtension**（装进现成的编辑器） |
| 分发 | 自己编译引擎 / 下载自带 GodotJS 的 Godot 编辑器 | 下载按引擎切分的 addons 压缩包，解压进工程 |
| 引擎版本 | 跟随其引擎分支 | **Godot 4.7+**（`compatibility_minimum = 4.7`） |
| 构建 | 引擎的构建流程 | `SConstruct`，一条 `scons` 命令 |

## 分发与安装

- **不发布引擎二进制**。上游 `getting-started` 的核心是下载一个自带 GodotJS 的 `Godot.app` / `godot.exe`
  并加进 PATH（其站点用 `release-selector.js` 拉 GitHub Releases 帮你筛）。
  本仓只发布 addons 包，用你已有的 Godot 4.7+ 编辑器。见[安装](/guide/installation)。
- **按引擎分包**。上游是"一个 Godot 二进制"；本仓的包按 JS 引擎切分
  （v8 / qjs-ng / jsc / node / web），每包只含该引擎真正构建的平台。
  包内的 `.gdextension` 只声明包内实际存在的文件。
- **`[information]` 段是本仓自有元数据**。Godot 的 `.gdextension` 格式只认
  `[configuration]` / `[libraries]` / `[dependencies]` / `[icons]` 四个段；
  `[information]`（name/version/author/...）引擎不解析，仅供人读，打包时会随发布 tag 更新 `version`。

## 引擎支持

- 本仓把 **Node.js** 作为一等引擎（`use_node=yes`，基于 libnode），上游没有。
- **Web** 在本仓是独立的一条腿（`platform=web` 且不加引擎标志 = 浏览器宿主 JS），并区分带线程/不带线程。
- 发布包覆盖 v8 / qjs-ng / jsc / node / web 五个引擎；`use_quickjs=yes` 是保留的本地构建选项，
  我们不专门为它构建发布包。
- 平台/引擎组合由 CI 构建矩阵**单点派生**，发布脚本与门禁共用同一份 plan。

## 构建

- 构建入口是本仓的 `SConstruct`（上游是引擎的模块构建）。
- **单一库两产物**（2026-09-28 合并）：`target=editor` 把运行时源码与编辑器源码编进**同一个**
  `godotjs-ext.<platform>.editor.<arch>`；`target=template_*` 只编运行时源码，
  产出 `godotjs-ext.<platform>.template_<flavor>.<arch>`。两个产物共用同一个入口符号
  `jsb_gdextension_init`。上游历史上是 runtime / editor 两个扩展。
- 绑定模式可选：`binding_mode=static|shared|dynamic`（默认 `shared`）。
  `static` / `shared` 会在构建时跑静态绑定 codegen，产出 `src/static_binding/gen/dispatch_*.gen.cpp`。
  运行时可从 `godot-jsb` 的 `BINDING_MODE` 读到当前模式。

## JS/TS API

- **注解有两套写法**。本仓推荐 `createClassBinder()`（`@bind()` / `@bind.export(...)`）；
  上游文档里的 `@Export` / `@ExportSignal` / `@Tool` 等是**旧式装饰器**，本仓仍支持但已标为弃用。
  见[注解](/scripting/annotations)。
- **旧路径已移除**。上游历史文档提到的 `jsb.core` 不再提供注解（`GLOBAL_GET` / `EDITOR_GET` /
  `callable()` / `to_array_buffer()` / `$wait()` 的旧位置也都不在了）：
  这些名字现在分别位于 `godot` 与 `godot.annotations` 模块。
- **Worker 模块化**：全局 `Worker` 改为 `godot.worker` 模块里的 `JSWorker`（配 `JSWorkerParent`）。
  上游 `worker.md` 里的 `worker.ontransfer` 在本仓的类型声明中**不存在**。
- **64 位整数**：本仓启用 `JSB_WITH_BIGINT`，超出安全整数的 64 位整数在 Godot → JS 方向以 `BigInt`
  返回；JS → Godot 接受 `number` 与 `bigint`。可用 `godot-jsb` 的 `BIGINT_FOR_64BIT` 探测。
- **静态成员暴露**：`@bind.exposed.const()` / `@bind.exposed.shared()` 是本仓的能力
  （GDScript 可读静态常量、可读写共享静态变量）。静态函数在任何形式下都不支持。
- **ShadowRealm**：`godot.shadowRealm` 模块（`JSShadowRealm` / `TransferableJSShadowRealm`），
  纯 Web 构建不提供。
- **类型视图**：内置 JS 包对外暴露类型视图（`typings/jsb.runtime.bundle.d.ts` /
  `jsb.editor.bundle.d.ts`）。

## 编辑器

- 底部 dock 名 **GodotJS-Ext**，含 REPL 与 Statistics 两个页签。
- 菜单集中在 **项目 → 工具 → GodotJS-Ext**：
  Generate API Data、Install Project Files、Generate Types、Config Enabled TS Classes、
  Generate All Scene Nodes Types、Generate All Resource Types、Cleanup Invalid Files。
- **源码注释即文档**：插件会解析 `.ts`/`.js` 源码注释，把类/成员的文档提供给编辑器
  （`@bind.help()` 优先级更高）。实现是一个常驻的 Node 工具进程。
- **签名边车**：编译产物旁边会有 `.sig` 文件承载函数/信号签名，导出时一并打包。
- 脚本类图标走 `.gdextension` 的 `[icons]` 段（本仓的 `GodotJSScript.svg` 是纯路径 SVG）。

## 测试与发布

- 测试规模不同：`project/tests/` 下有 20 组场景（含 cross-environment、default-args、
  indexed-props、int64、numeric、operators、static-members、中文路径 等）。
- C++ 单测是 doctest 单套件，`--jsb-run-tests` 一次跑完（editor 用例并入同一注册表）。
- 性能基准有独立流程：`-- --bench [--gc] [--only=<组>]`，CI 有 static/dynamic 双绑定的对比与一致性门禁。
- 发布链：Changesets 版本 PR → CI → `release.yml` → `misc_release.yml`（按引擎上传资产）。

## 仍可参考上游的部分

脚本语言层面的东西大多数仍然一致：`godot` 模块的用法、`GArray`/`GDictionary` 代理、
`Signal` / `Callable` 语义、类必须 `default export`、构造器约定、代码生成带来的类型提示。
本站在这些主题上按本仓事实重写，细节见相应页面。
