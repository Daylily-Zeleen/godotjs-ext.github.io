# 信号

## 声明

用 `@bind.signal()` 声明信号，签名由 `Signal<...>` 的泛型给出：

```ts
import { Node, Signal } from "godot";
import { createClassBinder } from "godot.annotations";

const bind = createClassBinder();

@bind()
export default class MyNode extends Node {
  @bind.signal()
  declare no_arg!: Signal<() => void>;

  @bind.signal()
  declare one_arg!: Signal<(param1: string) => void>;

  @bind.signal()
  declare two_args!: Signal<(param1: number, param2: string) => void>;
}
```

> [!NOTE]
> 用 `declare` + `!` 声明（不给初始值）：信号由运行时创建，不在 JS 侧赋值。

旧式写法是 `@ExportSignal()` 装饰器（`godot.annotations`），功能相同但已弃用。

## 发送

```ts
this.one_arg.emit("hello");
```

> [!WARNING]
> 信号参数只能是**Godot 原生类型**（`GArray`、`GDictionary`，以及基本类型）。
> 直接传裸 JS 对象不行：

```ts
this.some_signal.emit({ key: "value" });               // ❌ 裸 JS 对象
this.some_signal.emit(GDictionary.create({ key: "value" })); // ✅
```

## 连接与断开

```ts
import { Callable, Node } from "godot";

export default class MyClass extends Node {
  _ready() {
    this.get_node("Button").pressed.connect(Callable.create(this, this.handle_onclick), 0);
  }

  handle_onclick() {
    // ...
  }

  _exit_tree() {
    this.get_node("Button").pressed.disconnect(Callable.create(this, this.handle_onclick));
  }
}
```

`Callable.create(this, fn)` 的两个关键性质：

1. **相等性由 C++ 侧判定**。`Callable.create(this, this.fn) === Callable.create(this, this.fn)`
   在 JS 里是 `false`，但用于 `connect` / `disconnect` 时运行时会正确比对，所以断开连接是有效的。
2. **不强引用 `this`**。目标 JS 对象被 GC 后 callable 失效 —— 这通常是你想要的（不会泄漏对象）。

> [!WARNING]
> 不要用 lambda 捕获 `this`：`Callable.create(this, () => this.xxx())` 会让闭包持有对象，
> 造成对象泄漏。

## 等待信号

`Signal` 有 `as_promise()`，可以直接 `await`：

```ts
import { Node, Signal } from "godot";
import { createClassBinder } from "godot.annotations";

const bind = createClassBinder();

@bind()
export default class ExampleClass extends Node {
  @bind.signal()
  declare test_signal!: Signal<(value: number) => void>;

  _ready() {
    void this.wait_for_it();
  }

  async wait_for_it() {
    console.log("before signal emit");
    const result = await this.test_signal.as_promise();   // 123
    console.log("after signal emit", result);
  }

  emit_somehow() {
    this.test_signal.emit(123);
  }
}
```

> [!NOTE]
> 上游历史文档里的 `$wait(signal)` 已移除，等价能力就是 `as_promise()`。

## 相关

- [注解](/scripting/annotations)
- [模块与类型](/scripting/modules)
