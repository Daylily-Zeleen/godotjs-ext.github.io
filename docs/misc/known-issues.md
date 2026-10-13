# 已知问题

本页记录当前版本里用户会遇到、尚未处理的问题。

> 最后核对：2026-10-13。

## 1. 编辑器看不到脚本的模块依赖

**现象**：`.ts` / `.js` 脚本在编辑器的依赖图、依赖面板和 `ResourceLoader.get_dependencies()` 里都表现为「零依赖」。

**影响**：改动一个被 `import` 的模块，不会触发依赖它的脚本重新扫描或重新导入。

**不受影响**：导出打包与运行期都正常。

## 2. Autoload 不能在 JS/TS 里按名字使用

**现象**：GDScript 可以直接写 autoload 的名字（例如 `_Config`），JS/TS 不行。

**当前做法**：从场景树取节点——`get_node("/root/<名字>")`。引擎单例不受影响，照旧 `import { ... } from "godot"`。

## 3. node 环境里，node 层面的异常不是「当场」送达 `onerror`

**现象**：`use_node=yes` 时，node 定时器回调里抛出的异常、以及 node 层面的未捕获异常，转发到宿主
`onerror` 的时刻是**本轮引擎帧稍后**；来源是 worker（自己的线程）时，还要再等宿主下一次 `update()`。

**原因**：这类异常经 `process.setUncaughtExceptionCaptureCallback` 的回调进来，而该回调运行在 node 的
`InternalCallbackScope` 内部。在那里同步把宿主的 `onerror` 跑完（用户可能在里面 `terminate()` 掉这个环境），
会打乱 node 的异步栈——实测 `AsyncHooks::FailWithCorruptedAsyncStack` 并让进程直接退出。

**当前做法**：钩子里只暂存异常，等 `PumpEventLoop()` 返回（同一帧、node 的 async 作用域之外）再做采集与转发；
宿主与来源同线程时在本帧内送达，跨线程则排队。

**不受影响**：`evaluate` / `importValueSync` 这类同步入口、以及 shadow realm 的消息回调，仍按同步语义抛给调用方。

## 4. 脚本加载失败时，控制台会多出一行以 `Uncaught ` 开头的裸日志

**现象**：`use_node=yes`（以及 v8 后端）下，若某个 `.ts` / `.js` 脚本在加载阶段就抛异常（例如入口脚本一上来就
`throw new Error(...)`），控制台会看到形如：

```
WARNING: [jsb][Warning] something went wrong on loading 'res://...'
Uncaught Error: <你的错误信息>
Error: <你的错误信息>
    at ...
```

其中 `Uncaught Error: ...` 单独占一行、没有 `ERROR/WARNING` 前缀。

**原因**：脚本加载失败由 `Environment::load()` 就地捕获并打印（`jsb_environment.cpp`），它把异常信息拼进
一条多行日志。而 node / v8 后端从 V8 取异常文案（`v8::Message::Get()`）时，V8 用的固定模板是
`"Uncaught %"`（`MessageTemplate::kUncaughtException`）——**即使异常已被 try/catch 接住**，文案照样带
`Uncaught ` 前缀。该前缀被日志里的换行顶到行首，就成了这行裸日志。quickjs / JavaScriptCore 后端读的是
`err.message`，不会出现这个前缀。

**影响**：纯粹是日志外观。异常本身已被正常捕获、`load()` 正常返回失败码，运行行为不受影响。副作用是任何
按行扫描控制台输出、把行首 `Uncaught ...` 当成「未捕获异常」的工具/脚本会被误触发。

**当前做法**：无（未处理）。按行匹配控制台文本时，避免用行首 `^Uncaught` 作为判据；改用带前缀的形式
（如 `[jsb][Error]`）或直接以退出码 / 哨兵行判定。

## 5. 帮助文档里看不到 JS 侧的函数 / 常量 / 注解

**现象**：编辑器的帮助文档（`@GDScript` 那一节）会列出该语言的内建函数、全局常量与注解；
`@GodotJSScript` 一节则是空的。

**原因**：这三份清单由 `ScriptLanguage` 的 `_get_public_functions()` / `_get_public_constants()` /
`_get_public_annotations()` 提供，本扩展实现为返回空（`jsb_script_language.h`）。

**有意为之，不是缺陷**：把这些全局项全部摊进帮助文档收益很小，却会让该页非常臃肿、可读性很差。
C# 侧同样没有实现这三个接口，本扩展与之一致。

**不受影响**：脚本本身的功能、注解的实际行为、类型声明与自动补全都不依赖这三个接口；
它们只喂帮助文档里那一节。
