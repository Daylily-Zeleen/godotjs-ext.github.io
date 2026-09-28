# 注解

GodotJS 用**注解**（TypeScript 装饰器）把类成员暴露给 Godot：导出属性、信号、RPC、
静态常量等。

本仓有两套写法**并存**：

| 写法 | 状态 | 形态 |
|---|---|---|
| `createClassBinder()` | **推荐** | 每个脚本文件创建一个 binder，用 `@bind()` / `@bind.export(...)` 等 |
| 旧式装饰器 | 弃用但仍可用 | 直接从 `godot.annotations` 导入 `@Export` / `ExportSignal` / `Tool` … |

旧式装饰器都带 `@deprecated Use createClassBinder() instead.`，且需要 `experimentalDecorators`
编译选项（类型定义里会检查，不满足时报错）。新代码请用 `createClassBinder()`。

## 新式写法

```ts
import { Node, Variant } from "godot";
import { createClassBinder } from "godot.annotations";

const bind = createClassBinder();

@bind()
export default class MyNode extends Node {
  @bind.export(Variant.Type.TYPE_INT)
  accessor score: number = 0;
}
```

- `@bind()` 打在**类**上，声明"这是一个 Godot 脚本类"。
- `@bind.export(type, options?)` 打在**成员**上。
- 运行时会读取元数据并注册给 Godot。

## 导出属性

导出属性会随资源（场景/`Resource`）一起保存，并出现在检查器里。

```ts
@bind.export(Variant.Type.TYPE_STRING)
accessor address: string = "somewhere";

@bind.export(Variant.Type.TYPE_INT)
accessor age: number = 0;
```

> [!IMPORTANT]
> 类型必须**显式**给出 —— TypeScript 的类型在运行时不存在（译后只剩 JS），
> 所以用 `Variant.Type.*` 说明它对应哪个 Godot 类型。

默认值来自 **CDO（Class Default Object）**：GodotJS 会实例化一个纯 JS 的脚本类实例，
读取其成员值作为检查器里的默认值。所以**构造器里的代码会被执行**，别在构造器里做有副作用的初始化。

没有默认值时，会使用该 Godot 类型的默认值（例如 `0`）。

### `export` 的修饰形式

| 修饰 | 作用 |
|---|---|
| `@bind.export.multiline()` | 多行文本 |
| `@bind.export.range(min, max, step, ...hints)` | 浮点范围 |
| `@bind.export.range_int(min, max, step, ...hints)` | 整数范围 |
| `@bind.export.file(filter)` / `.dir(filter)` / `.global_file(filter)` / `.global_dir(filter)` | 文件/目录路径 |
| `@bind.export.exp_easing(hint?)` | 缓动曲线 |
| `@bind.export.array(clazz)` | 指定元素类型的数组 |
| `@bind.export.dictionary(key, value)` | 指定键值类型的字典 |
| `@bind.export.object(clazz)` | 对象引用 |
| `@bind.export.enum(enum_type)` | 枚举下拉（仅 int） |
| `@bind.export.flags(enum_type)` | 位标志 |
| `@bind.export.cache()` | 缓存 getter 结果 |

范围提示的额外参数：`or_greater`、`or_less`、`exp`、`prefer_slider`、`hide_control`、
`radians_as_degree`、`degree`、`suffix:<文本>`。

```ts
@bind.export.range(0, 100, 1)
accessor speed: number = 0;

@bind.export.enum(Color2)
accessor color: Color2 = Color2.Red;
```

枚举导出在检查器里是下拉框（仅支持 int 取值的枚举）。

## 信号

```ts
import { Signal } from "godot";

@bind.signal()
declare no_arg!: Signal<() => void>;

@bind.signal()
declare one_arg!: Signal<(x: string) => void>;
```

详见[信号](/scripting/signals)。

## RPC

```ts
@bind.rpc({ mode: "any_peer", sync: "call_local", transfer_mode: "reliable", transfer_channel: 0 })
apply_damage(amount: number) { /* ... */ }
```

配置字段（类型声明 `RPCConfig`）：

| 字段 | 取值 |
|---|---|
| `mode` | `Godot.MultiplayerApi.RpcMode`（`"disabled"` / `"any_peer"` / `"authority"`） |
| `sync` | `"call_remote"` / `"call_local"` |
| `transfer_mode` | `Godot.MultiplayerPeer.TransferMode`（`"unreliable"` / `"unreliable_ordered"` / `"reliable"`） |
| `transfer_channel` | 通道号 |

## 其它类级注解

| 注解 | 作用 |
|---|---|
| `@bind.tool()` | 让类**在编辑器里**也被实例化（对应 GDScript 的 `@tool`） |
| `@bind.icon(path)` | 编辑器场景树里该类节点的图标 |
| `@bind.help(message)` | 给类或成员写文档文本（**优先于**源码注释） |
| `@bind.deprecated(message?)` | 标记弃用 |
| `@bind.experimental(message?)` | 标记实验性 |

```ts
@bind.tool()
@bind.icon("res://icon/affiliate.svg")
export default class MyTool extends Node {}
```

### `onready`

```ts
@bind.onready("get_node('Label')")
accessor label!: Label;
```

字符串在 `_ready()` 之前求值，赋给该成员。

## 静态成员暴露

静态成员要暴露给 Godot（可被 GDScript 读取）有两种方式：

```ts
// 常量：只读，编译期值
@bind.exposed.const()
static readonly N: number = 42;

// 共享静态变量：可读可写，所有 JS 环境共用同一个值
@bind.exposed.shared()
static score = 0;
```

- `exposed.const()` 只接受白名单形状：数字、字符串、布尔、`null`、`BigInt`、枚举、
  `GArray`/`GDictionary`。`Vector2` 这类值类型、JS 数组字面量、函数**会被拒绝**。
- `exposed.shared()` 用于**不是常量**的东西，包括 `Node`/`Resource` 实例和 Godot 值类型。
  它由进程级存储支撑，因此 worker 或 shadow realm 里读到的是同一个值；初始化器只在
  第一个加载该模块的环境里跑一次。
- **静态函数不支持**，任何形式都不行（`SomeScript.fn()`、`.call(...)`、`SomeScript.call("fn")`）。
  原因是脚本类被所有 JS 环境共享，而解析结果不携带环境身份，没有可派发的目标环境；
  静态函数碰到的模块级状态也会在各 isolate 间静默分叉。把行为写成实例方法。

类形式（成员在类外的同名 `namespace` 里声明）也可用：

```ts
@bind.exposed.const("NS_N", "NS_ARR")
export default class C {}

export namespace C {
  export const NS_N = 1;
  export const NS_ARR = GArray.create([1, 2]);
}
```

## 旧式装饰器（弃用）

```ts
import { Node, Variant } from "godot";
import { Export, ExportSignal, Tool, Icon, ExportRange } from "godot.annotations";

@Tool()
export default class Legacy extends Node {
  @Export(Variant.Type.TYPE_FLOAT)
  speed: number = 0;

  @ExportSignal()
  declare test!: Signal<(x: string) => void>;

  @ExportRange(0, 10, 1)
  power: number = 1;
}
```

可用清单：`Export`、`ExportVar`、`export_`、`ExportMultiline`、`ExportRange`、`ExportIntRange`、
`ExportFile`、`ExportGlobalFile`、`ExportDir`、`ExportGlobalDir`、`ExportExpEasing`、`ExportArray`、
`ExportDictionary`、`ExportObject`、`ExportEnum`、`ExportFlags`、`ExportSignal`、`Rpc`、`OnReady`、
`Tool`、`Icon`、`Deprecated`、`Experimental`、`Help`，以及对应的 snake_case 形式
（`signal`、`export_multiline`、`export_range`、`tool`、`icon`…）。

> [!WARNING]
> 上游文档里的 `@Export` / `@ExportSignal` 等写法就是这一套。它们仍然工作，但新项目不建议使用。
> 上游历史文档里提到的 `jsb.core` 路径已经不存在了：这些名字现在只有 `godot.annotations`
> 一个来源。

## 相关

- [信号](/scripting/signals)
- [第一个脚本](/guide/first-script)
