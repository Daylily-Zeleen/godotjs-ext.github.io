# 虚函数与方法解析

> 最后核对：2026-10-13。

JS 类的**虚函数**（`_ready`、`_process`、`_notification`、`_get`、`_set`、`_get_property_list` 等）
按 **JS 原型链**解析，和 GDScript 不一样。本页说明差异，以及什么时候必须自己写 `super`。

## 一句话结论

引擎只在**最派生的那一份**上调用虚函数：从最派生类沿原型链往上找，**命中第一个就停**。
派生类定义了同名方法就是**替换**基类那份；想让基类也跑到，得自己写 `super.xxx(...)`。

GDScript 相反：引擎会遍历整条脚本继承链，**每层都调一次**。
这是三种脚本语言里 GDScript 独有的行为，C# 同样按单次虚分派处理。

## 三种脚本语言对照

以 `class Derived extends Base` 为例，两者都定义 `_notification`，`Derived` **不**写 `super`：

| 派生类 | GDScript | JS/TS（本扩展） | C# |
|---|---|---|---|
| 只基类定义 | `Base` | `Base` | `Base` |
| 派生类也定义、不写 `super` | `Base` → `Derived` | **只有 `Derived`** | 只有 `Derived` |
| 派生类也定义、写了 `super` | `Base` → `Derived` → `Base` | `Derived` → `Base` | `Derived` → `Base` |

## 派生类里要调基类，就显式写 `super`

```ts
import { Node } from "godot";

class Base extends Node {
  _ready(): void {
    console.log("base ready");
  }
}

export default class Derived extends Base {
  _ready(): void {
    super._ready(); // 不写这行，基类的 _ready 不会被执行
    console.log("derived ready");
  }
}
```

> [!IMPORTANT]
> 从 GDScript 或 C# 迁过来时最容易踩这条。GDScript 里派生类覆盖 `_ready` 后基类照样会跑，
> 在 JS 里**不会** —— 少写 `super` 会让基类的初始化被静默跳过。

## 首次定义与写 `super` 的取舍

`super` 只在**覆盖**时才有意义。若基类没有这个方法，`super.xxx()` 会因找不到而报错；
反过来，基类方法想被复用，就应该在派生类的覆盖里显式调用。

```ts
import { Object } from "godot";

export default class Derived extends Base {
  _notification(what: number): void {
    if (what === Object.NOTIFICATION_PREDELETE) {
      // 处理完自己的事后，把通知继续交给基类
    }
    super._notification(what);
  }
}
```

## 属性 hook 同样只调一次

`_get` / `_set` / `_get_property_list` / `_validate_property` / `_property_can_revert` /
`_property_get_revert` 这一组也遵循上面的规则：**每个 hook 每属性/每次访问只被调用一次**，
由最派生的那份实现响应。

`_validate_property` 是**每个属性调一次**（引擎对属性列表逐项校验），这是引擎契约，不是重复调用。

```ts
import { Node } from "godot";

export default class MyNode extends Node {
  _get(property: string): any {
    if (property === "computed") {
      return 42;
    }
    return null; // 交给引擎继续按常规属性处理
  }

  _set(property: string, value: any): boolean {
    if (property === "computed") {
      return true; // 已消费该写入
    }
    return false;
  }
}
```

> [!NOTE]
> `_get` 返回 `null` 表示"我不处理这个属性"，引擎会继续走常规路径；
> `_set` 返回 `false` 同理。返回值语义与 Godot 一致。

## 为什么这样设计

JS 的 `prototype`/`__proto__` 查找本来就是"从最派生往上、命中即止"，虚函数直接沿用这套语义，
不会出现"同名方法被调多次"这种在 JS 里很反直觉的行为。GDScript 没有原型链，
只能用脚本继承链遍历来达到"每层都收到"的效果，因此成了异类。

## 相关

- [信号](/scripting/signals)
- [注解](/scripting/annotations)
