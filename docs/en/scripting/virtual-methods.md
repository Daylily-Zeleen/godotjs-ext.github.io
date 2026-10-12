# Virtual methods and method resolution

> Last reviewed: 2026-10-13.

Virtual methods on JS classes (`_ready`, `_process`, `_notification`, `_get`, `_set`,
`_get_property_list`, ...) resolve through the **JS prototype chain**, which differs from GDScript.
This page covers the difference and when you must write `super` yourself.

## The short version

The engine calls a virtual method on the **most derived** declaration only: it walks the prototype
chain upwards from the most derived class and **stops at the first hit**. A subclass that defines a
method **replaces** the base version; to also run the base one, call `super.xxx(...)` explicitly.

GDScript is the opposite: the engine walks the whole script inheritance chain and calls **every**
level. Of the three script languages, GDScript is the odd one out -- C# also does a single virtual
dispatch.

## Comparison across the three script languages

With `class Derived extends Base`, both defining `_notification`, and `Derived` **not** calling
`super`:

| Case | GDScript | JS/TS (this extension) | C# |
|---|---|---|---|
| Only the base defines it | `Base` | `Base` | `Base` |
| Subclass defines it, no `super` | `Base` -> `Derived` | **`Derived` only** | `Derived` only |
| Subclass defines it, calls `super` | `Base` -> `Derived` -> `Base` | `Derived` -> `Base` | `Derived` -> `Base` |

## Call the base explicitly from a subclass

```ts
import { Node } from "godot";

class Base extends Node {
  _ready(): void {
    console.log("base ready");
  }
}

export default class Derived extends Base {
  _ready(): void {
    super._ready(); // without this line the base _ready never runs
    console.log("derived ready");
  }
}
```

> [!IMPORTANT]
> This is the easiest trap when porting from GDScript or C#. In GDScript a subclass overriding
> `_ready` still runs the base one; in JS it does **not** -- omitting `super` silently skips the
> base initialisation.

## When `super` makes sense

`super` is only meaningful when you are **overriding**. If the base has no such method,
`super.xxx()` throws because the lookup fails. Conversely, if base behaviour should be reused, the
override has to call it.

```ts
import { Object } from "godot";

export default class Derived extends Base {
  _notification(what: number): void {
    if (what === Object.NOTIFICATION_PREDELETE) {
      // handle your own work first, then hand the notification to the base
    }
    super._notification(what);
  }
}
```

## Property hooks are called once too

`_get` / `_set` / `_get_property_list` / `_validate_property` / `_property_can_revert` /
`_property_get_revert` follow the same rule: **each hook runs once** per property access, served by
the most derived implementation.

`_validate_property` is called **once per property** (the engine validates each entry of the property
list); that is the engine contract, not a repeated call.

```ts
import { Node } from "godot";

export default class MyNode extends Node {
  _get(property: string): any {
    if (property === "computed") {
      return 42;
    }
    return null; // let the engine treat it as an ordinary property
  }

  _set(property: string, value: any): boolean {
    if (property === "computed") {
      return true; // this write is consumed
    }
    return false;
  }
}
```

> [!NOTE]
> Returning `null` from `_get` means "I do not handle this property" and the engine continues down
> the regular path; `_set` uses `false` the same way. The return-value semantics match Godot.

## Why it works this way

JS `prototype`/`__proto__` lookup already means "walk up from the most derived, stop at the first
hit". Virtual methods reuse exactly that, avoiding the counter-intuitive "same method runs several
times" behaviour. GDScript has no prototype chain, so it walks the script inheritance chain to
achieve "every level hears it" -- which is what makes it the outlier.

## See also

- [Signals](/en/scripting/signals)
- [Annotations](/en/scripting/annotations)
