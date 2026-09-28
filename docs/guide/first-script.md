# 第一个脚本

## 最小脚本

```ts
import { Node } from "godot";

export default class MyNode extends Node {
  _ready() {
    console.log("MyNode _ready");
  }
}
```

要点：

- 类**必须**是 `default export`。否则 GodotJS 不会把它当作合法的脚本类。
- 继承自 Godot 对象类型（这里是 `Node`），生命周期回调 `_ready()` / `_process()` 等按名字映射。
- 文件放在 `res://` 下，扩展名 `.ts`（或 `.js`）。

## 在编辑器里创建

新建脚本时把语言选为 **GodotJSScript**，模板用 `Node: Node.Ts` 即可。
创建后 IDE 里应当有完整的类型提示（前提是已经[生成类型](/guide/project-setup#4-生成类型声明)）。

## 构造器：默认不要写

继承 Godot 对象的脚本类**不建议**显式定义 `constructor`。GodotJS 会用特殊方式构造脚本对象
（例如类默认对象 CDO、跨环境绑定），显式构造器容易在这些路径上出错。

如果确实需要，签名必须带 `identifier?: any`，并且调用 `super(identifier)`：

```ts
import { Node } from "godot";

export default class MyExampleNode extends Node {
  constructor(identifier?: any) {
    super(identifier);
    // 其它初始化
  }
}
```

在脚本里用 `new` 直接实例化时**不要传参**（`identifier` 由运行时提供）：

```ts
const node = new MyExampleNode();
```

## 异步

脚本里可以自由使用 `async/await`，包括 `_ready` 这类回调：

```ts
import { Node } from "godot";

function seconds(secs: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), secs * 1000));
}

export default class MyJSNode extends Node {
  async call_me() {
    await seconds(1);
  }
}
```

`setTimeout` / `setInterval` / `console` 等宿主能力由运行时按引擎注入，声明见 `typings/`。

## 导出属性

用注解把类成员暴露给 Godot：

```ts
import { Node, Variant } from "godot";
import { createClassBinder } from "godot.annotations";

const bind = createClassBinder();

@bind()
export default class Shooter extends Node {
  @bind.export(Variant.Type.TYPE_FLOAT)
  accessor speed: number = 0;
}
```

详见[注解](/scripting/annotations)。注意这里用的是本仓的新式写法（`createClassBinder()`）；
上游文档里的 `@Export(...)` 装饰器仍可用，但已标记为弃用。

## 下一步

- [模块与类型](/scripting/modules)：`godot` 模块里到底有什么
- [信号](/scripting/signals)：定义、连接与等待信号
