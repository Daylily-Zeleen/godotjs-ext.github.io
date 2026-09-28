# 与上游 GodotJS 的差异

GodotJS-Ext 的起点是 [godotjs/GodotJS](https://github.com/godotjs/GodotJS)。
上游仓库里的 JS/TS 运行时、模块系统、注解体系都源自那里，很多 API 文档仍然适用；
但**分发形态与实现已经分叉**，照搬上游文档会在若干处踩坑。本页逐条列出差异。

## 一句话总结

| | 上游 GodotJS | GodotJS-Ext（本仓） |
|---|---|---|
| 形态 | **引擎模块**（作为 Godot 源码树的一部分编译，`SCsub` / `config.py`） | **GDExtension**（`SConstruct`，入口 `jsb_gdextension_init`） |
| 分发 | 自己编译引擎 / 下载自带 GodotJS 的 Godot 编辑器 | 下载按引擎切分的 addons 压缩包，解压进工程 |
| 引擎版本 | 跟随所编引擎 | **Godot 4.7+**（`compatibility_minimum = 4.7`，godot-cpp 按 `API_VERSION = "4.7"` 生成） |
| 构建 | 引擎的模块构建流程 | `SConstruct`，一条 `scons` 命令 |

## 分发与安装

- **不发布引擎二进制**。上游发布的是**整个 Godot 编辑器/模板**（asset 名形如
  `linux-editor-4.6.1-v8.zip`），其站点用 `release-selector.js` 拉 GitHub Releases 按 OS/引擎/目标筛选。
  本仓只发布 addons 包，用你已有的 Godot 4.7+ 编辑器。见[安装](/guide/installation)。
- **按引擎分包**。本仓的包按 JS 引擎切分（v8 / qjs-ng / jsc / node / web），
  每包只含该引擎真正构建的平台，包内的 `.gdextension` 只声明包内实际存在的文件。
- **`[information]` 段是本仓自有元数据**。Godot 的 `.gdextension` 格式只认
  `[configuration]` / `[libraries]` / `[dependencies]` / `[icons]` 四个段；
  `[information]`（name/version/author/...）引擎不解析，仅供人读，打包时会随发布 tag 更新 `version`。

## 引擎支持

- 本仓把 **Node.js** 作为一等引擎（`use_node=yes`，基于 libnode），三个桌面腿都构建。
  上游的 `config.py` 只有 `use_jsc` / `use_quickjs` / `use_quickjs_ng`，**没有** Node 宿主。
- **Web** 在本仓是独立的一条腿（`platform=web` 且不加引擎标志 = 浏览器宿主 JS，`JSB_WITH_WEB`），
  并区分带线程/不带线程。
- 发布包覆盖 v8 / qjs-ng / jsc / node / web 五个引擎；`use_quickjs=yes` 是保留的本地构建选项，
  我们不专门为它构建发布包。
- 平台/引擎组合由 CI 构建矩阵**单点派生**，发布脚本与门禁共用同一份 plan。

## 构建

- 构建入口是本仓的 `SConstruct`（上游是引擎的模块构建）。
- **单一库两产物**：`target=editor` 把运行时源码与编辑器源码编进**同一个**
  `godotjs-ext.<platform>.editor.<arch>`；`target=template_*` 只编运行时源码，
  产出 `godotjs-ext.<platform>.template_<flavor>.<arch>`。两个产物共用同一个入口符号
  `jsb_gdextension_init`。
  上游没有两个库——它是**单个引擎模块**，仅在 `env.editor_build` 时把 `weaver-editor/*.cpp`
  追加进去。"单一库"是本仓自己的历史：曾拆成两个 GDExtension 靠 C-ABI 桥通信，2026-09-28
  因该依赖无法消除而合并回一个并删掉桥。
- 绑定模式可选：`binding_mode=static|shared|dynamic`（默认 `shared`）。
  `static` / `shared` 会在构建时跑静态绑定 codegen，产出 `src/static_binding/gen/dispatch_*.gen.cpp`。
  运行时可从 `godot-jsb` 的 `BINDING_MODE` 读到当前模式。
  上游的 `JSB_WITH_STATIC_BINDINGS` 在 `jsb.config.h` 里写着 **`// NOT IMPLEMENTED YET`** 且恒为 `0`，
  静态绑定文件体是空的 `#if`；上游唯一可用的是运行期 ClassDB 反射。
- **`api_tool` 惰性二进制库**：上游没有这个组件——它的绑定数据来自运行期 ClassDB 反射与
  编辑器生成的 `.d.ts`。本仓方法记录分热/冷两层：热层（48~72 B）供每次
  ptrcall 读取，冷层 `ApiMethodDetail` 由编辑器 codegen 首次访问时才加载；类方法表从
  3,475,812 B 降到 1,110,366 B，布局由 `static_assert` 钉住。
- **窄整型槽截断而非拒绝**：与引擎一致（引擎的 `binder_common.h` 从不校验宽度，而静态腿原先会拒），
  越界只在 debug 构建告警，release 零开销。

## JS/TS API

- **注解：两套写法在本仓与上游都并存**。`createClassBinder()`（`@bind()` / `@bind.export(...)`）
  **不是本仓新增**，上游也有；差异在于本仓把它作为推荐写法，而旧式
  `@Export` / `@ExportSignal` / `@Tool` / `Rpc` / `OnReady` 等装饰器仍由运行时导出
  （均带 `@deprecated Use createClassBinder() instead.`）。见[注解](/scripting/annotations)。
- **`jsb.core` 与 `godot.annotations` 都有效**。上游历史文档提到的 `GLOBAL_GET` / `EDITOR_GET`
  仍由 `jsb.core` 导出。
- **静态成员暴露是本仓的能力**：`@bind.exposed.const()` / `@bind.exposed.shared()` 让 GDScript
  能读静态常量、读写共享静态变量。上游 `GodotJSScript` 的 `get_constants()` / `get_members()`
  是**空 stub**，其 `ClassBinder` 类型也没有 `exposed` 这一项。静态函数在任何形式下都不支持。
- **`godot.shadowRealm` 是本仓的 JS 侧 realm API，上游没有**。每个 realm 是一个独立环境
  （`Environment::Type::ShadowRealm`），提供 `evaluate` / `importValue` / `importValueSync` /
  `addAllowedModuleSearchPath` / `terminate`；`TransferableJSShadowRealm` 还能跨 realm
  `postMessage` Godot 对象（对侧是 `ShadowRealmParent`）。纯 Web 构建不提供。
  > 注意别和上游的 `ShadowEnvironment` 混淆：那是异步 `ResourceLoader` 用的**临时环境**，
  > 没有 realm 语义。上游 `Environment::Type` 里的 `Shadow` 标着 `[reserved] for future use`，
  > 没有任何实现。
- **`godot.worker` 的传送契约收窄**：全局 `Worker` 改为 `godot.worker` 模块里的 `JSWorker`
  （配 `JSWorkerParent`），传送列表作为 `postMessage(message, transfer?)` 的参数传入。
  上游的类型声明里 `worker.ontransfer` / `JSWorkerParent.transfer()` 仍在（已标 deprecated）；
  本仓只保留参数形态，类型检查器会拦住旧写法。
- **64 位整数**：上游同样有 `JSB_WITH_BIGINT`，超过 2^53-1 也走 `BigInt`；
  本仓补上的是**无符号出口路径**（上游显式转换 `uint32`，且压根没有 `uint64` 类型）、
  `bigint` 可作构造器/运算符操作数，以及**双边**幅值判据（上游各引擎 helper 是 `p_val > MAX`
  单边，导致负的大数被 `(double)` 静默舍入，`ObjectID` 往返因此失真）。
  运行时可用 `godot-jsb` 的 `BIGINT_FOR_64BIT` 探测。
- **运行期自省**：`BINDING_MODE` / `BIGINT_FOR_64BIT` 由本仓的 `godot-jsb` 导出，上游没有这两个。
- **类型视图**：内置 JS 包对外暴露类型视图（`typings/jsb.runtime.bundle.d.ts` /
  `jsb.editor.bundle.d.ts`）。

## 编辑器

- 底部 dock 名 **GodotJS-Ext**，含 REPL 与 Statistics 两个页签。
- 菜单集中在 **项目 → 工具 → GodotJS-Ext**：
  Generate API Data、Install Project Files、Generate Types、Config Enabled TS Classes、
  Generate All Scene Nodes Types、Generate All Resource Types、Cleanup Invalid Files。
- **源码注释即文档，上游完全不读注释**。上游只从显式调用（`@bind.help()` /
  `deprecated` / `experimental`）与引擎自带 XML 取文档。本仓由常驻 Node 工具进程解析
  `.ts`/`.js` 源码注释，显式注解仍优先于注释。
- **签名边车 `.sig`**：编译产物旁承载函数/信号签名，导出时一并打包。上游没有任何磁盘签名缓存
  （它每轮把类型信息重新生成进 `.d.ts`，而运行期重载在 JS 侧不可观测）。
- **Config Enabled TS Classes** 对话框（上游只有 `codegen/ignored_classes` 设置项，没有对话框）。
- **按源文件 codegen**：除类与文档类型外，本仓还为工程内容生成类型——每个场景产出
  `<Scene>.nodes.gen.ts`（节点路径 → 类型）与 `<Scene>.tscn.gen.ts`（`PackedScene<T>` /
  `ResourceLoader.load()` 返回类型），每个脚本资源产出 `<res>.gen.ts`（`ResourceTypes` 条目）。
- 脚本类图标走 `.gdextension` 的 `[icons]` 段（本仓的 `GodotJSScript.svg` 是纯路径 SVG）。

## 测试与发布

- 测试规模不同：`project/tests/` 下有 16 组场景（benchmark、cross-environment、default-args、
  extend、gen_dts_test、indexed-props、int64、numeric、operators、os-executor、papaparse、
  paths_test、resource、singleton、static-members，以及一个中文路径用例）。
- C++ 单测是 doctest 单套件，`--jsb-run-tests` 一次跑完（editor 用例并入同一注册表）。
- 性能基准有独立流程：`-- --bench [--gc] [--only=<组>]`，CI 有 static/dynamic 双绑定的对比与一致性门禁。
  上游没有基准套件（只有编译期的慢操作日志宏），也就无法对比两种绑定模式。
- 发布链：Changesets 版本 PR → CI → `release.yml` → `misc_release.yml`（按引擎上传资产）。

## 仍可参考上游的部分

脚本语言层面的东西大多数仍然一致：`godot` 模块的用法、`GArray`/`GDictionary` 代理、
`Signal` / `Callable` 语义、类必须 `default export`、构造器约定、代码生成带来的类型提示、
`createClassBinder()` 与本仓的旧式注解。本站在这些主题上按本仓事实重写，细节见相应页面。
