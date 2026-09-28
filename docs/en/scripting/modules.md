# Modules and types

GodotJS exposes three **built-in modules** to scripts, plus the declarations generated for your
project:

| Module | Contents | When |
|---|---|---|
| `godot` | Engine classes (`Node`, `Resource`, `Sprite2D`, ...), utility functions, singletons, variant types (`Vector2`, `GArray`, `GDictionary`, ...), `Signal`, `Callable` | Almost every script |
| `godot-jsb` | Runtime introspection: build flags, `impl` name, low-level `jsb.internal.*` | When probing the runtime, or writing library code |
| `godot.worker` | `JSWorker` / `JSWorkerParent` | Multithreading (experimental) |

Plus `godot.shadowRealm` (ShadowRealm, experimental; not available in Web builds).

## The `godot` module

Its types are resolved **lazily**: `import { Node } from "godot"` does not pull the whole engine API
into memory, only the classes you actually touch are resolved. The data comes from the editor's
binary store (`.godot/.api_dumping`), so [generating the API data](/en/guide/project-setup#4-generate-type-declarations)
is a prerequisite.

The resolution order is **singleton -> utility function -> class**.

### Enums

Godot enums are plain JS `enum`s, and the constant values are not also hung off the class:

```ts
import { Image } from "godot";

let mode: Image.AlphaMode = Image.AlphaMode.ALPHA_NONE;

console.log(mode);                    // 0
console.log(Image.AlphaMode[mode]);   // "ALPHA_NONE"
```

`Image.ALPHA_NONE` does **not** exist in GodotJS (the GDScript spelling does not carry over).

### Variant types

Godot `Variant` values that map losslessly onto JS primitives are mapped:

| Godot | JS | Caveat |
|---|---|---|
| `NIL` | `any` | `NIL` as a type means "any Variant parameter" |
| `INT` | `number` | int64 engine-side; precision is lost beyond 2^53-1 (see below) |
| `FLOAT` | `number` | |
| `STRING` | `string` | |
| `STRING_NAME` | `string` | |

Everything else (`Vector2`, `PackedStringArray`, `Array`, `Dictionary`, ...) is a JS `class`.

64-bit integers: this repository builds with `JSB_WITH_BIGINT`. In the **Godot -> JS** direction an
integer outside the safe range is returned as a `BigInt`; **JS -> Godot** accepts both `number` and
`bigint`. Probe the current build at runtime with `import { BIGINT_FOR_64BIT } from "godot-jsb"`.

### Value semantics pitfalls

Variant values are passed **by value across the JS<->C++ boundary**, but remain by-reference inside
pure JS:

```ts
import { Input, Vector3 } from "godot";

const value = new Vector3();
Input.set_gyroscope(value);   // a copy goes in

function modify(v: Vector3) {
  v.x = 1;
}

modify(value);         // value.x becomes 1 (object reference semantics)
modify(node.position); // node.position is untouched: the getter returned a copy
```

So **do not** write `node.position.x = 0;`. It works in GDScript, and in JS it does **not even
error** - it just mutates a copy. That silent failure is the dangerous part.

## `GArray` / `GDictionary`

Godot's array and dictionary are their own types; engine methods take and return them rather than JS
arrays and objects.

### Creating

```ts
import { GArray, GDictionary } from "godot";

const arr = GArray.create([1, 2, 3]);          // type information is preserved
const num: number = arr.get(0);
// const str: string = arr.get(0);             // compile error

const nested = GArray.create([["a"], ["b"]]);
const first: string = nested.get(0).get(0);    // recursion works

const dict = GDictionary.create({ foo: "bar" });
const foo: string = dict.get("foo");
```

### Proxy access

`.proxy()` lets you index them like JS arrays and objects:

```ts
const arr = GArray.create([1, 2, 3]).proxy();
const a: number = arr[0];
arr[0] = 42;

const dict = GDictionary.create({ nested: [[{ foo: "bar" }]] }).proxy();
const s: string = dict.nested[0]![0]!.foo;
```

Proxies are `Proxy` objects created on demand; **frequent nested access costs**, so spreading once is
cheaper:

```ts
const shallow: number[] = [...GArray.create([1, 2, 3]).proxy()];
const plain = { ...GDictionary.create({ a: 1 }).proxy() };
```

Spreading is a **shallow** copy: nested Godot containers stay proxies.

The `ProxyTarget` symbol unwraps a proxy back to the original object, and passing a proxy to
something expecting a `GArray`/`GDictionary` also works (the runtime unwraps it).

## Packed arrays and ArrayBuffer

```ts
const a1 = new PackedStringArray();
const a2 = new PackedStringArray();
a2.append("test2");

a1.append_array(a2);            // explicit
a1.append_array(["hey"]);       // implicit (depends on the implicit packed-array conversion flag)

a1.get_indexed(2);
a1.set_indexed(2, "new");
```

An `ArrayBuffer` can be used **implicitly** where a `PackedByteArray` is expected:

```ts
const buffer = new ArrayBuffer(16);
new Uint8Array(buffer).fill(0);
file.store_buffer(buffer);
```

The other direction is explicit:

```ts
const packed = FileAccess.get_file_as_bytes("res://something.txt");
const buffer = packed.to_array_buffer();
```

## StringName

The mapping between `StringName` and JS strings is cached by the runtime, so just pass a string where
a `StringName` is expected - no extra allocation:

```ts
import { Input } from "godot";

if (Input.is_action_just_pressed("confirm")) {
  // ...
}
```

## The `godot-jsb` module

```ts
import * as jsb from "godot-jsb";

jsb.BINDING_MODE;                 // "static" | "shared" | "dynamic"
jsb.BIGINT_FOR_64BIT;             // whether 64-bit ints come back as BigInt
jsb.CAMEL_CASE_BINDINGS_ENABLED;  // whether camelCase bindings are on
jsb.DEV_ENABLED;
jsb.TOOLS_ENABLED;
jsb.version;
jsb.impl;                         // current engine implementation name
jsb.$import("http://.../mod.js"); // async module import (set_async_module_loader first)
```

`jsb.internal.*` is the low-level surface library code uses (name mapping under `names.*`,
`ObjectUtils`, ...); ordinary game scripts rarely need it.

## The `godot.worker` module

```ts
import { JSWorker } from "godot.worker";

const worker = new JSWorker("res://worker.ts");
worker.onmessage = (m) => console.log("master got", m);
worker.postMessage("hello");
```

Inside a worker script use `JSWorkerParent`. See the [JS engines](/en/runtime/engines) page and
`project/tests/cross-environment/` in the repository.

## Where the declarations come from

- `typings/godot.minimal.d.ts` - hand-written declarations for the built-in modules and host capabilities
- `typings/godot.mix.d.ts` - the entry point mixing built-in and generated declarations
- `typings/godot*.gen.d.ts` - generated from the engine API data (classes, methods, properties, enums)
- `gen/godot/**/*.gen.ts` - types for your own scenes and resources

`typings/jsb.runtime.bundle.d.ts` and `jsb.editor.bundle.d.ts` are the outward type views of the two
bundled JS packages.
