# Signals

## Declaring

Declare a signal with `@bind.signal()`; the signature comes from the `Signal<...>` generic:

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
> Use `declare` with `!` (no initializer): the signal is created by the runtime and never assigned on
> the JS side.

The legacy spelling is the `@ExportSignal()` decorator (from `godot.annotations`); it behaves the
same and is deprecated.

## Emitting

```ts
this.one_arg.emit("hello");
```

> [!WARNING]
> Signal arguments may only be **Godot-native values** (`GArray`, `GDictionary` and primitives).
> A bare JS object is not accepted:

```ts
this.some_signal.emit({ key: "value" });                      // wrong: bare JS object
this.some_signal.emit(GDictionary.create({ key: "value" }));  // right
```

## Connecting and disconnecting

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

Two properties of `Callable.create(this, fn)` matter:

1. **Equality is decided in C++.** `Callable.create(this, this.fn) === Callable.create(this, this.fn)`
   is `false` in JS, but the runtime compares them correctly for `connect` / `disconnect`, so
   disconnecting works.
2. **It does not hold a strong reference to `this`.** Once the target JS object is garbage
   collected the callable becomes invalid - usually what you want (no leaked objects).

> [!WARNING]
> Do not capture `this` in a lambda: `Callable.create(this, () => this.xxx())` keeps the object alive
> through the closure and leaks it.

## Awaiting a signal

`Signal` has `as_promise()`, so it can be awaited directly:

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
> The `$wait(signal)` helper from older upstream docs is gone; `as_promise()` is its replacement.

## See also

- [Annotations](/en/scripting/annotations)
- [Modules and types](/en/scripting/modules)
