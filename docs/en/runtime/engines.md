# JS engines

GodotJS-Ext supports several JavaScript engines. Which one you get is decided by **the release archive
you downloaded** - it is fixed at build time and cannot be switched at runtime (ask `impl` on
`godot-jsb` which one you have).

## Engines and release archives

| Engine | scons selection | Packaged | Platform coverage |
|---|---|---|---|
| **V8** (default) | no engine flag | `v8` | Windows, Linux (x86_64 + arm64), macOS (arm64), Android (arm64 + x86_64), iOS (arm64) |
| **QuickJS-NG** | `use_quickjs_ng=yes` | `qjs-ng` | The widest: all of the above plus Web (wasm32, threaded and not) |
| **JavaScriptCore** | `use_jsc=yes` | `jsc` | macOS (arm64) and iOS (arm64) only |
| **Node.js** | `use_node=yes` | `node` | Desktop only: Windows, Linux (x86_64), macOS (arm64) |
| **Browser host JS** | `platform=web` with no engine flag | `web` | Web only (wasm32) |
| QuickJS | `use_quickjs=yes` | not packaged | Local build option |

- Archive names state the platforms, e.g. `godotjs-ext-v8-windows-linux-macos-android-ios.zip`; see
  [Installation](/en/guide/installation).
- The archives cover the **packaged** engines in the table above; `use_quickjs=yes` is a retained local
  build option that is not built for release.
- `web` is not `v8`: with `platform=web` and no engine flag the build is necessarily the **browser host
  JS** (`JSB_WITH_WEB`), because no V8 prebuilt exists for web. In release terms it is its own archive.

> [!NOTE]
> Feature sets differ slightly per engine. `godot.worker.d.ts` and ShadowRealm, for instance, are not
> installed in **pure web builds**, since the browser host has no equivalent threading/isolation story.

## Trade-offs

| | Strengths | Costs |
|---|---|---|
| **V8** | Best performance and the best debugging story (Chrome DevTools / VS Code breakpoints); most mature ecosystem | Large binary; depends on a prebuilt V8 archive |
| **QuickJS-NG** | Small, widest platform coverage (including Web), plain C source that cross-compiles easily | Slower than V8; no Chrome debugger |
| **JavaScriptCore** | Native on Apple platforms, no extra dependency | macOS/iOS only; debug with Safari |
| **Node.js** | Bundles libnode, so Node's ecosystem and module resolution are available | Desktop only; depends on a prebuilt libnode archive |
| **Browser host JS** | Nothing extra to pack into the wasm bundle | Web only; bounded by the host browser |

## Selecting it at build time

```bash
# V8 (default)
scons platform=windows target=editor -j10

# QuickJS-NG
scons platform=windows target=editor use_quickjs_ng=yes -j10

# JavaScriptCore (Apple platforms)
scons platform=macos target=editor use_jsc=yes -j10

# Node.js
scons platform=windows target=editor use_node=yes -j10

# Browser host JS (Web platform, no engine flag)
scons platform=web target=template_release -j10
```

`use_node=yes` implies `use_v8` (libnode embeds V8) but links libnode instead of the standalone V8
monolith. `use_jsc` / `use_quickjs*` / `use_node` have a precedence order; the engine actually in
effect is printed as a `javascript engine: ...` line in the build log.

Where the decision lives (`release-packaging.md`): **to change which engine supports which platforms,
edit the CI build matrix only**. The packaging script `misc/release/package.py` and the release gate
both derive from that same matrix, so "gate green but a platform missing from the archive" cannot
happen.

## Probing at runtime

```ts
import * as jsb from "godot-jsb";

console.log(jsb.impl);                       // "v8" / "quickjs" / "node" / ...
console.log(jsb.BINDING_MODE);               // "static" | "shared" | "dynamic"
console.log(jsb.BIGINT_FOR_64BIT);           // whether 64-bit ints come back as BigInt
console.log(jsb.CAMEL_CASE_BINDINGS_ENABLED);
```

## See also

- [Installation](/en/guide/installation)
- [Project setup](/en/guide/project-setup)
