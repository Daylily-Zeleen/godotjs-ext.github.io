# 模块与类型

GodotJS 给脚本暴露了三个**内置模块**，加上工程自己生成的声明：

| 模块 | 内容 | 何时用 |
|---|---|---|
| `godot` | 引擎类（`Node`、`Resource`、`Sprite2D`…）、工具函数、单例、变体类型（`Vector2`、`GArray`、`GDictionary`…）、`Signal`、`Callable` | 几乎所有脚本 |
| `godot-jsb` | 运行时自省：构建期开关、`impl` 名称、`jsb.internal.*` 底层接口 | 需要探测运行时或写库代码时 |
| `godot.worker` | `JSWorker` / `JSWorkerParent` | 多线程（实验性） |

外加 `godot.shadowRealm`（ShadowRealm，实验性，Web 构建不提供）。

## `godot` 模块

`godot` 的类型**惰性解析**：`import { Node } from "godot"` 不会一次性把整个引擎 API 装进内存，
而是用到哪个类才解析哪个。数据来自编辑器生成的二进制库（`.godot/.api_dumping`），
所以必须先[生成 API 数据](/guide/project-setup#4-生成类型声明)。

解析顺序是：**单例 → 工具函数 → 类**。

### 枚举

Godot 的枚举在 JS 里就是普通 `enum`，且枚举常量值不会再单独挂到类上：

```ts
import { Image } from "godot";

let mode: Image.AlphaMode = Image.AlphaMode.ALPHA_NONE;

console.log(mode);                    // 0
console.log(Image.AlphaMode[mode]);   // "ALPHA_NONE"
```

`Image.ALPHA_NONE` 在 GodotJS 里**不存在**（GDScript 里的那种写法不适用）。

### 变体类型

Godot `Variant` 能无损映射到 JS 原语的会被映射：

| Godot | JS | 注意 |
|---|---|---|
| `NIL` | `any` | `NIL` 作为类型表示"任意 Variant 参数" |
| `INT` | `number` | 引擎侧是 int64；|值| 超过 2^53-1 时精度会丢（见下） |
| `FLOAT` | `number` | |
| `STRING` | `string` | |
| `STRING_NAME` | `string` | |

其余（`Vector2`、`PackedStringArray`、`Array`、`Dictionary`…）是 JS 里的 `class`。

64 位整数：本仓启用 `JSB_WITH_BIGINT`。**Godot → JS** 方向上，超出安全整数的 64 位整数会以
`BigInt` 返回；**JS → Godot** 方向接受 `number` 与 `bigint`。可用
`import { BIGINT_FOR_64BIT } from "godot-jsb"` 在运行时判断当前构建。

### 值语义陷阱

变体类型在 **JS↔C++ 边界**上按值传递，在**纯 JS 内部**仍是引用：

```ts
import { Input, Vector3 } from "godot";

const value = new Vector3();
Input.set_gyroscope(value);   // 传进去的是副本

function modify(v: Vector3) {
  v.x = 1;
}

modify(value);        // value.x 变成 1（对象引用语义）
modify(node.position); // node.position 不受影响：getter 返回的是副本
```

因此 **不要**写 `node.position.x = 0;`。它在 GDScript 里有效，在 JS 里也**不报错**，
只是改了个副本 —— 这种静默失败更危险。

## `GArray` / `GDictionary`

Godot 的数组/字典是独立类型，引擎方法收发的是它们而不是 JS 数组/对象。

### 创建

```ts
import { GArray, GDictionary } from "godot";

const arr = GArray.create([1, 2, 3]);          // 类型信息保留
const num: number = arr.get(0);
// const str: string = arr.get(0);             // 编译错误

const nested = GArray.create([["a"], ["b"]]);
const first: string = nested.get(0).get(0);    // 递归生效

const dict = GDictionary.create({ foo: "bar" });
const foo: string = dict.get("foo");
```

### 代理访问

`.proxy()` 让你像用 JS 数组/对象一样索引它们：

```ts
const arr = GArray.create([1, 2, 3]).proxy();
const a: number = arr[0];
arr[0] = 42;

const dict = GDictionary.create({ nested: [[{ foo: "bar" }]] }).proxy();
const s: string = dict.nested[0]![0]!.foo;
```

代理是按需创建的 `Proxy` 对象；**频繁嵌套访问有开销**，一次性展开更划算：

```ts
const shallow: number[] = [...GArray.create([1, 2, 3]).proxy()];
const plain = { ...GDictionary.create({ a: 1 }).proxy() };
```

注意展开是**浅拷贝**，嵌套的 Godot 容器仍是代理。

代理对象用 `ProxyTarget` 符号可以取回原对象；把它传给需要 `GArray`/`GDictionary` 的函数也没问题
（运行时会自动拆包）。

## Packed Array 与 ArrayBuffer

```ts
const a1 = new PackedStringArray();
const a2 = new PackedStringArray();
a2.append("test2");

a1.append_array(a2);            // 显式
a1.append_array(["hey"]);       // 隐式（依赖隐式打包数组转换开关）

a1.get_indexed(2);
a1.set_indexed(2, "new");
```

`ArrayBuffer` 可以**隐式当成** `PackedByteArray` 传进去：

```ts
const buffer = new ArrayBuffer(16);
new Uint8Array(buffer).fill(0);
file.store_buffer(buffer);
```

反方向需要显式调用：

```ts
const packed = FileAccess.get_file_as_bytes("res://something.txt");
const buffer = packed.to_array_buffer();
```

## StringName

`StringName` 与 JS 字符串之间的映射由运行时缓存，传递 `StringName` 参数时直接写字符串即可，
不会有额外分配：

```ts
import { Input } from "godot";

if (Input.is_action_just_pressed("confirm")) {
  // ...
}
```

## `godot-jsb` 模块

```ts
import * as jsb from "godot-jsb";

jsb.BINDING_MODE;                 // "static" | "shared" | "dynamic"
jsb.BIGINT_FOR_64BIT;             // 64 位整数是否以 BigInt 返回
jsb.CAMEL_CASE_BINDINGS_ENABLED;  // 是否启用了驼峰命名绑定
jsb.DEV_ENABLED;
jsb.TOOLS_ENABLED;
jsb.version;
jsb.impl;                         // 当前引擎实现名
jsb.$import("http://.../mod.js"); // 异步模块导入（需先 set_async_module_loader）
```

`jsb.internal.*` 是给库代码用的底层接口（`names.*` 做名字映射、`ObjectUtils` 等），
业务脚本一般用不到。

## `godot.worker` 模块

```ts
import { JSWorker } from "godot.worker";

const worker = new JSWorker("res://worker.ts");
worker.onmessage = (m) => console.log("master got", m);
worker.postMessage("hello");
```

worker 脚本里用 `JSWorkerParent`。详见[运行时的引擎页](/runtime/engines)与仓库的
`project/tests/cross-environment/` 示例。

## 类型声明来自哪里

- `typings/godot.minimal.d.ts` —— 手写的内置模块声明（`godot-jsb`、宿主能力）
- `typings/godot.mix.d.ts` —— 内置与生成声明的混合入口
- `typings/godot*.gen.d.ts` —— 由引擎 API 数据生成（类、方法、属性、枚举）
- `gen/godot/**/*.gen.ts` —— 你工程自己的场景与资源类型

`typings/jsb.runtime.bundle.d.ts` / `jsb.editor.bundle.d.ts` 则是两个内置 JS 包对外的类型视图。
