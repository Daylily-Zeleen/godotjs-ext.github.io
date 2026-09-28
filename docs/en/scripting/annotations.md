# Annotations

GodotJS uses **annotations** (TypeScript decorators) to expose class members to Godot: exported
properties, signals, RPCs, static constants and more.

Two forms **coexist** in this repository:

| Form | Status | Shape |
|---|---|---|
| `createClassBinder()` | **Recommended** | One binder per script file, then `@bind()` / `@bind.export(...)` |
| Legacy decorators | Deprecated but working | Import `@Export` / `ExportSignal` / `Tool` ... straight from `godot.annotations` |

The legacy decorators all carry `@deprecated Use createClassBinder() instead.` and require the
`experimentalDecorators` compiler option (the type declarations check for it and error otherwise).
New code should use `createClassBinder()`.

## The current form

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

- `@bind()` goes on the **class** and marks it as a Godot script class.
- `@bind.export(type, options?)` goes on a **member**.
- The runtime reads the recorded metadata and registers it with Godot.

## Exported properties

Exported properties are saved with the resource (scene / `Resource`) and shown in the inspector.

```ts
@bind.export(Variant.Type.TYPE_STRING)
accessor address: string = "somewhere";

@bind.export(Variant.Type.TYPE_INT)
accessor age: number = 0;
```

> [!IMPORTANT]
> The type must be given **explicitly** - TypeScript types do not exist at runtime (nothing but JS
> survives compilation), so `Variant.Type.*` states which Godot type it corresponds to.

Default values come from the **CDO (Class Default Object)**: GodotJS instantiates a pure JS instance
of the script class and reads the member as the inspector's default. That means **constructor code
runs** - do not put side effects there.

Without a default value, the default of that Godot type is used (`0`, for instance).

### `export` modifiers

| Modifier | Effect |
|---|---|
| `@bind.export.multiline()` | Multi-line text |
| `@bind.export.range(min, max, step, ...hints)` | Float range |
| `@bind.export.range_int(min, max, step, ...hints)` | Integer range |
| `@bind.export.file(filter)` / `.dir(filter)` / `.global_file(filter)` / `.global_dir(filter)` | File/directory paths |
| `@bind.export.exp_easing(hint?)` | Easing curve |
| `@bind.export.array(clazz)` | Array with a declared element type |
| `@bind.export.dictionary(key, value)` | Dictionary with declared key/value types |
| `@bind.export.object(clazz)` | Object reference |
| `@bind.export.enum(enum_type)` | Enum dropdown (ints only) |
| `@bind.export.flags(enum_type)` | Bit flags |
| `@bind.export.cache()` | Cache the getter result |

Extra range hints: `or_greater`, `or_less`, `exp`, `prefer_slider`, `hide_control`,
`radians_as_degree`, `degree`, `suffix:<text>`.

```ts
@bind.export.range(0, 100, 1)
accessor speed: number = 0;

@bind.export.enum(Color2)
accessor color: Color2 = Color2.Red;
```

An exported enum becomes a dropdown in the inspector (int-valued enums only).

## Signals

```ts
import { Signal } from "godot";

@bind.signal()
declare no_arg!: Signal<() => void>;

@bind.signal()
declare one_arg!: Signal<(x: string) => void>;
```

See [Signals](/en/scripting/signals).

## RPC

```ts
@bind.rpc({ mode: "any_peer", sync: "call_local", transfer_mode: "reliable", transfer_channel: 0 })
apply_damage(amount: number) { /* ... */ }
```

The config fields (the `RPCConfig` declaration):

| Field | Values |
|---|---|
| `mode` | `Godot.MultiplayerApi.RpcMode` (`"disabled"` / `"any_peer"` / `"authority"`) |
| `sync` | `"call_remote"` / `"call_local"` |
| `transfer_mode` | `Godot.MultiplayerPeer.TransferMode` (`"unreliable"` / `"unreliable_ordered"` / `"reliable"`) |
| `transfer_channel` | Channel number |

## Other class-level annotations

| Annotation | Effect |
|---|---|
| `@bind.tool()` | Lets the class be instantiated **in the editor** (GDScript's `@tool`) |
| `@bind.icon(path)` | Icon for nodes of this class in the editor scene tree |
| `@bind.help(message)` | Documentation text for the class or member (**wins over** source comments) |
| `@bind.deprecated(message?)` | Mark as deprecated |
| `@bind.experimental(message?)` | Mark as experimental |

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

The string is evaluated before `_ready()` and assigned to the member.

## Exposing static members

Static members reach Godot (and thus GDScript) in two ways:

```ts
// constant: read-only, compile-time value
@bind.exposed.const()
static readonly N: number = 42;

// shared static variable: readable and writable, one value for all JS environments
@bind.exposed.shared()
static score = 0;
```

- `exposed.const()` accepts only a whitelist of shapes: numbers, strings, booleans, `null`, `BigInt`,
  enums, `GArray`/`GDictionary`. Godot value types such as `Vector2`, JS array literals and functions
  are **rejected**.
- `exposed.shared()` is for things that are **not** constants, including `Node`/`Resource` instances
  and Godot value types. It is backed by a process-wide store, so a worker or shadow realm observes
  the same value, and the initializer runs once, in whichever environment loads the module first.
- **Static functions are not supported**, in any form (`SomeScript.fn()`, `.call(...)`,
  `SomeScript.call("fn")`). A script class is shared by every JS environment while the parse result
  carries no environment identity, so there is no defensible environment to dispatch to; and any
  module-level state a static function touched would silently diverge per isolate. Expose the
  behaviour as an instance method instead.

The class form (members declared in a same-named `namespace` outside the class) also works:

```ts
@bind.exposed.const("NS_N", "NS_ARR")
export default class C {}

export namespace C {
  export const NS_N = 1;
  export const NS_ARR = GArray.create([1, 2]);
}
```

## Legacy decorators (deprecated)

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

Available: `Export`, `ExportVar`, `export_`, `ExportMultiline`, `ExportRange`, `ExportIntRange`,
`ExportFile`, `ExportGlobalFile`, `ExportDir`, `ExportGlobalDir`, `ExportExpEasing`, `ExportArray`,
`ExportDictionary`, `ExportObject`, `ExportEnum`, `ExportFlags`, `ExportSignal`, `Rpc`, `OnReady`,
`Tool`, `Icon`, `Deprecated`, `Experimental`, `Help`, plus the snake_case spellings (`signal`,
`export_multiline`, `export_range`, `tool`, `icon`, ...).

> [!WARNING]
> This set is **the same one upstream ships**, and it still works in both - it is simply deprecated
> (`@deprecated Use createClassBinder() instead.`). Prefer `createClassBinder()` for new code.
> Do not copy the older upstream docs here: `jsb.core` today exports `GLOBAL_GET` / `EDITOR_GET` and a
> few legacy aliases; `godot.annotations` is the canonical source for the annotations above.

## See also

- [Signals](/en/scripting/signals)
- [Your first script](/en/guide/first-script)
