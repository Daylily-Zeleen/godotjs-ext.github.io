# Your first script

## Minimal script

```ts
import { Node } from "godot";

export default class MyNode extends Node {
  _ready() {
    console.log("MyNode _ready");
  }
}
```

Key points:

- The class **must** be the `default export`, otherwise GodotJS will not treat it as a valid script class.
- Extending a Godot object type (here `Node`); lifecycle callbacks such as `_ready()` / `_process()` are
  matched by name.
- The file lives under `res://` with a `.ts` (or `.js`) extension.

## Create it in the editor

When creating a new script pick **GodotJSScript** as the language and use the `Node: Node.Ts`
template. You should then get full type hints in your IDE (assuming the [types were
generated](/en/guide/project-setup#4-generate-type-declarations)).

## Constructors: do not write one by default

Script classes extending Godot objects should **not** declare a `constructor`. GodotJS constructs
script objects in special ways (the class default object, cross-environment binding), and an explicit
constructor easily breaks those paths.

If you really need one, the signature must take `identifier?: any` and it must call
`super(identifier)`:

```ts
import { Node } from "godot";

export default class MyExampleNode extends Node {
  constructor(identifier?: any) {
    super(identifier);
    // other initialisation
  }
}
```

When instantiating directly from a script, pass **no arguments** (`identifier` is supplied by the
runtime):

```ts
const node = new MyExampleNode();
```

## Async

`async/await` is available everywhere in a script, including callbacks such as `_ready`:

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

Host capabilities such as `setTimeout` / `setInterval` / `console` are provided per engine by the
runtime; their declarations live in `typings/`.

## Exported properties

Expose class members to Godot with an annotation:

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

See [Annotations](/en/scripting/annotations). Note this is this repository's current form
(`createClassBinder()`); the upstream `@Export(...)` decorators still work but are marked deprecated.

## Next

- [Modules and types](/en/scripting/modules): what is actually inside the `godot` module
- [Signals](/en/scripting/signals): declaring, connecting and awaiting signals
