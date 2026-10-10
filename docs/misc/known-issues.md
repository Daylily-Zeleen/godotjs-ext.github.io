# 已知问题

本页记录当前版本里用户会遇到、尚未处理的问题。

> 最后核对：2026-10-05。

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

