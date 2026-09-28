# Differences from upstream

GodotJS-Ext started from [godotjs/GodotJS](https://github.com/godotjs/GodotJS). The JS/TS runtime,
the module system and the annotation set all originate there, so much of its API documentation still
applies - but **the distribution form and the implementation have diverged**, and copying upstream
docs verbatim fails in several places. This page itemises the differences.

> Every claim here was checked against upstream's own sources on `main`, not inferred from names.

## In one line

| | Upstream GodotJS | GodotJS-Ext (this repository) |
|---|---|---|
| Form | **Engine module** (compiled as part of a Godot source tree, `SCsub` / `config.py`) | **GDExtension** (`SConstruct`, entry `jsb_gdextension_init`) |
| Distribution | Build the engine yourself, or download a Godot editor with GodotJS embedded | Download a per-engine addons archive and unpack it into your project |
| Engine version | Follows the engine source you build against | **Godot 4.7+** (`compatibility_minimum = 4.7`, godot-cpp generated against `API_VERSION = "4.7"`) |
| Build | The engine's module build flow | `SConstruct`, one `scons` command |

## Distribution and installation

- **No engine binaries are published.** Upstream ships **whole Godot editors and templates** (assets
  named like `linux-editor-4.6.1-v8.zip`), filtered on its site by `release-selector.js` across
  OS/engine/target. This repository publishes addons archives only and uses the Godot 4.7+ editor you
  already have. See [Installation](/en/guide/installation).
- **Split per engine.** The archives here are split by JS engine (v8 / qjs-ng / jsc / node / web),
  each carrying only the platforms that engine is built for. The `.gdextension` inside an archive
  declares only the files that archive actually contains.
- **`[information]` is this repository's own metadata.** Godot's `.gdextension` format honours only
  `[configuration]` / `[libraries]` / `[dependencies]` / `[icons]`;
  `[information]` (name/version/author/...) is not parsed by the engine and exists for humans. The
  packager rewrites its `version` from the release tag.

## Engine support

- **Node.js** is a first-class engine here (`use_node=yes`, libnode-based) and is built on all three
  desktop legs. Upstream's `config.py` only has `use_jsc` / `use_quickjs` / `use_quickjs_ng` -
  **no Node host at all**.
- **Web** is its own leg here (`platform=web` with no engine flag = the browser host JS,
  `JSB_WITH_WEB`), and threaded and non-threaded variants are distinguished.
- The release archives cover five engines (v8 / qjs-ng / jsc / node / web); `use_quickjs=yes` is a
  retained local build option that is not built for release.
- Platform/engine pairings are **derived from one place**, the CI build matrix; the packaging script
  and the release gate share that same plan.

## Build

- The build entry point is this repository's `SConstruct` (upstream builds through the engine's module
  system).
- **One library, two products**: `target=editor` compiles the runtime *and* the editor sources into a
  single `godotjs-ext.<platform>.editor.<arch>`; `target=template_*` compiles the runtime sources only,
  producing `godotjs-ext.<platform>.template_<flavor>.<arch>`. Both share the single entry symbol
  `jsb_gdextension_init`. Upstream does not have two libraries - it is **one engine module** that only
  appends `weaver-editor/*.cpp` when the engine is built with the editor (`if env.editor_build`).
  "One library" is this repository's own history: it once shipped two GDExtensions talking over a C-ABI
  bridge, merged back into one (and the bridge deleted) on 2026-09-28 because that dependency could not
  be removed in the first place.
- The binding mode is selectable: `binding_mode=static|shared|dynamic` (default `shared`).
  `static` / `shared` run the static-binding codegen at build time, emitting
  `src/static_binding/gen/dispatch_*.gen.cpp`. The active mode is readable at runtime as
  `BINDING_MODE` from `godot-jsb`. Upstream's `JSB_WITH_STATIC_BINDINGS` is annotated
  `// NOT IMPLEMENTED YET` in its `jsb.config.h` and is hardcoded to `0` - its static-binding file body
  is an empty `#if` - so runtime ClassDB reflection is all it has.
- **`api_tool`: a lazy binary store** - upstream has no such component (`grep api_tool` over its whole
  tree: 0 hits); it produces binding data through runtime ClassDB reflection plus editor-generated
  `.d.ts`. Here method records are split into a hot layer (48-72 B) that every ptrcall reads and a cold
  `ApiMethodDetail` layer loaded on first access by the editor's codegen; the class-method table
  dropped from 3,475,812 B to 1,110,366 B and the layouts are pinned by `static_assert`.
- **Narrow integer slots truncate instead of rejecting**, matching the engine (its `binder_common.h`
  never checks width, while the static leg used to reject). Out-of-range values only warn in debug
  builds; release pays nothing.

## JS/TS API

- **Annotations: two forms exist in both repositories.** `createClassBinder()` (`@bind()` /
  `@bind.export(...)`) is **not** new here - upstream has it too. The difference is that this
  repository recommends it, while the legacy `@Export` / `@ExportSignal` / `@Tool` / `Rpc` / `OnReady`
  decorators are still exported by the runtime (all carrying
  `@deprecated Use createClassBinder() instead.`). See [Annotations](/en/scripting/annotations).
- **Both `jsb.core` and `godot.annotations` work.** `GLOBAL_GET` / `EDITOR_GET`, mentioned in older
  upstream docs, are still exported by `jsb.core`.
- **Static member exposure is ours**: `@bind.exposed.const()` / `@bind.exposed.shared()` let GDScript
  read static constants and read/write shared static variables. Upstream's `GodotJSScript`
  `get_constants()` / `get_members()` overrides are **empty stubs**, and its `ClassBinder` type has no
  `exposed` member. Static *functions* are not supported in any form.
- **`godot.shadowRealm` is this repository's JS-facing realm API; upstream has none.** Each realm is
  its own environment (`Environment::Type::ShadowRealm`) and can `evaluate` / `importValue` /
  `importValueSync` / `addAllowedModuleSearchPath` / `terminate`; `TransferableJSShadowRealm`
  additionally `postMessage`s Godot objects across realms (with `ShadowRealmParent` on the far side).
  Not available on pure web builds.
  > Do not confuse it with upstream's `ShadowEnvironment`: that is a **transient environment** used by
  > the async `ResourceLoader`, with no realm semantics. Upstream's `Environment::Type` carries a
  > `Shadow` value marked `[reserved] for future use` and nothing implements it.
- **The worker transfer contract is narrower here**: the global `Worker` became `JSWorker` in the
  `godot.worker` module (with `JSWorkerParent`), and the transferable list is an argument of
  `postMessage(message, transfer?)`. Upstream's declarations still carry
  `worker.ontransfer` / `JSWorkerParent.transfer()` (marked deprecated); this repository exposes only
  the parameter form, and the type checker rejects the old one.
- **64-bit integers**: upstream has `JSB_WITH_BIGINT` too and also emits `BigInt` above 2^53-1. What
  this repository adds is the **unsigned exit path** (upstream converts `uint32` explicitly and has no
  `uint64` type at all), `bigint` as a constructor and operator operand, and a **two-sided** magnitude
  test - upstream's per-engine helpers use a one-sided `p_val > MAX`, which silently rounds *negative*
  out-of-range values through `(double)` and breaks `ObjectID` round-tripping. Probe the active
  position with `BIGINT_FOR_64BIT` from `godot-jsb`.
- **Runtime introspection**: `BINDING_MODE` / `BIGINT_FOR_64BIT` are exported by this repository's
  `godot-jsb`; upstream has neither.
- **Type views**: the bundled JS packages expose outward type views
  (`typings/jsb.runtime.bundle.d.ts` / `jsb.editor.bundle.d.ts`).

## Editor

- The bottom dock is called **GodotJS-Ext** and has REPL and Statistics tabs.
- The commands live under **Project -> Tools -> GodotJS-Ext**: Generate API Data, Install Project
  Files, Generate Types, Config Enabled TS Classes, Generate All Scene Nodes Types, Generate All
  Resource Types, Cleanup Invalid Files.
- **Source comments are documentation - upstream reads no comments at all.** It takes documentation
  only from explicit calls (`@bind.help()` / `deprecated` / `experimental`) plus the engine's own XML.
  Here a resident Node tool process parses the `.ts`/`.js` source, and explicit annotations still win
  over the comment.
- **Signature sidecars (`.sig`)**: function/signal signatures next to the compiled output, packaged on
  export. Upstream has no on-disk signature cache - it regenerates type information into `.d.ts` each
  run, and runtime overloads stay unobservable from JS.
- **Config Enabled TS Classes**: a dialog for choosing which native classes get bindings generated
  (upstream only has the `codegen/ignored_classes` setting, no dialog).
- **Per-source codegen**: beyond class and documentation types, this repository generates typed
  surfaces for the project's own content - every scene yields a `<Scene>.nodes.gen.ts` (node path to
  type) and a `<Scene>.tscn.gen.ts` (`PackedScene<T>` / `ResourceLoader.load()` return type), and a
  script resource yields a `<res>.gen.ts` (`ResourceTypes` entry).
- Script class icons come from the `.gdextension` `[icons]` section (this repository's
  `GodotJSScript.svg` is a path-only SVG).

## Testing and release

- Different scale: `project/tests/` contains 16 scenario groups (benchmark, cross-environment,
  default-args, extend, gen_dts_test, indexed-props, int64, numeric, operators, os-executor, papaparse,
  paths_test, resource, singleton, static-members, and a CJK-path case).
- C++ unit tests are a single doctest suite; `--jsb-run-tests` runs it once (editor cases are compiled
  into the same registry).
- Benchmarking is its own flow: `-- --bench [--gc] [--only=<group>]`, with a static-vs-dynamic
  comparison and consistency gate in CI. Upstream has no benchmark suite (only a compile-time slow-path
  log macro), so it cannot compare the two binding modes.
- Release chain: Changesets version PR -> CI -> `release.yml` -> `misc_release.yml` (assets uploaded per
  engine).

## What you can still read upstream for

Most of the script-language layer is unchanged: how the `godot` module works, `GArray`/`GDictionary`
proxies, `Signal` / `Callable` semantics, the `default export` requirement, constructor conventions,
the type hints produced by code generation, and `createClassBinder()` itself. This site rewrites those
topics against this repository's facts; see the respective pages.
