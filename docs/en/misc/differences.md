# Differences from upstream

GodotJS-Ext started from [godotjs/GodotJS](https://github.com/godotjs/GodotJS). The JS/TS runtime,
the editor plugin and the annotation set all originate there, so much of its API documentation still
applies - but **the distribution form and the implementation have diverged**, and copying upstream
docs verbatim fails in several places. This page itemises the differences.

## In one line

| | Upstream GodotJS | GodotJS-Ext (this repository) |
|---|---|---|
| Form | **Engine module** (compiled as part of a Godot source tree) | **GDExtension** (installed into an existing editor) |
| Distribution | Build the engine yourself, or download a Godot editor with GodotJS embedded | Download a per-engine addons archive and unpack it into your project |
| Engine version | Follows its engine branch | **Godot 4.7+** (`compatibility_minimum = 4.7`) |
| Build | The engine's own build flow | `SConstruct`, one `scons` command |

## Distribution and installation

- **No engine binaries are published.** Upstream's `getting-started` centres on downloading a
  `Godot.app` / `godot.exe` with GodotJS baked in and adding it to PATH (their site filters GitHub
  Releases with `release-selector.js`). This repository publishes addons archives only and uses the
  Godot 4.7+ editor you already have. See [Installation](/en/guide/installation).
- **Split per engine.** Upstream ships "one Godot binary"; here the archives are split by JS engine
  (v8 / qjs-ng / jsc / node / web), each carrying only the platforms that engine is built for. The
  `.gdextension` inside an archive declares only the files that archive actually contains.
- **`[information]` is this repository's own metadata.** Godot's `.gdextension` format honours only
  `[configuration]` / `[libraries]` / `[dependencies]` / `[icons]`;
  `[information]` (name/version/author/...) is not parsed by the engine and exists for humans. The
  packager rewrites its `version` from the release tag.

## Engine support

- **Node.js** is a first-class engine here (`use_node=yes`, libnode-based); upstream has no such leg.
- **Web** is its own leg here (`platform=web` with no engine flag = the browser host JS), and threaded
  and non-threaded variants are distinguished.
- The release archives cover five engines (v8 / qjs-ng / jsc / node / web); `use_quickjs=yes` is a
  retained local build option that is not built for release.
- Platform/engine pairings are **derived from one place**, the CI build matrix; the packaging script
  and the release gate share that same plan.

## Build

- The build entry point is this repository's `SConstruct` (upstream builds through the engine's module
  system).
- **One library, two products** (merged 2026-09-28): `target=editor` compiles the runtime *and* the
  editor sources into a single `godotjs-ext.<platform>.editor.<arch>`; `target=template_*` compiles
  the runtime sources only, producing `godotjs-ext.<platform>.template_<flavor>.<arch>`. Both share the
  single entry symbol `jsb_gdextension_init`. Upstream historically shipped two extensions (runtime and
  editor).
- The binding mode is selectable: `binding_mode=static|shared|dynamic` (default `shared`).
  `static` / `shared` run the static-binding codegen at build time, emitting
  `src/static_binding/gen/dispatch_*.gen.cpp`. The active mode is readable at runtime as
  `BINDING_MODE` from `godot-jsb`.

## JS/TS API

- **Two annotation forms.** This repository recommends `createClassBinder()` (`@bind()` /
  `@bind.export(...)`); the `@Export` / `@ExportSignal` / `@Tool` decorators in the upstream docs are the
  **legacy** form - still supported here, but marked deprecated. See [Annotations](/en/scripting/annotations).
- **Old paths are gone.** The `jsb.core` module no longer provides the annotations mentioned in older
  upstream docs (nor do `GLOBAL_GET` / `EDITOR_GET` / `callable()` / `to_array_buffer()` / `$wait()` live
  where they used to): those names now live in the `godot` and `godot.annotations` modules.
- **Workers were modularised**: the global `Worker` became `JSWorker` in the `godot.worker` module
  (with `JSWorkerParent`). The `worker.ontransfer` in upstream's `worker.md` **does not exist** in this
  repository's declarations.
- **64-bit integers**: this repository builds with `JSB_WITH_BIGINT`, so integers beyond the safe range
  come back as `BigInt` in the Godot -> JS direction; JS -> Godot accepts `number` and `bigint`. Probe
  with `BIGINT_FOR_64BIT` from `godot-jsb`.
- **Static member exposure**: `@bind.exposed.const()` / `@bind.exposed.shared()` are this repository's
  own capability (GDScript can read static constants and read/write shared static variables). Static
  *functions* are not supported in any form.
- **ShadowRealm**: the `godot.shadowRealm` module (`JSShadowRealm` / `TransferableJSShadowRealm`), not
  available in pure web builds.
- **Type views**: the bundled JS packages expose outward type views
  (`typings/jsb.runtime.bundle.d.ts` / `jsb.editor.bundle.d.ts`).

## Editor

- The bottom dock is called **GodotJS-Ext** and has REPL and Statistics tabs.
- The commands live under **Project -> Tools -> GodotJS-Ext**: Generate API Data, Install Project
  Files, Generate Types, Config Enabled TS Classes, Generate All Scene Nodes Types, Generate All
  Resource Types, Cleanup Invalid Files.
- **Source comments are documentation**: the plugin parses `.ts`/`.js` source comments and hands class
  and member docs to the editor (`@bind.help()` takes precedence). It is implemented as a resident Node
  tool process.
- **Signature sidecars**: `.sig` files next to the compiled output carry function/signal signatures and
  are packaged on export.
- Script class icons come from the `.gdextension` `[icons]` section (this repository's
  `GodotJSScript.svg` is a path-only SVG).

## Testing and release

- Different scale: `project/tests/` contains 20 scenario groups (cross-environment, default-args,
  indexed-props, int64, numeric, operators, static-members, a CJK-path case, ...).
- C++ unit tests are a single doctest suite; `--jsb-run-tests` runs it once (editor cases are compiled
  into the same registry).
- Benchmarking is its own flow: `-- --bench [--gc] [--only=<group>]`, with a static-vs-dynamic
  comparison and consistency gate in CI.
- Release chain: Changesets version PR -> CI -> `release.yml` -> `misc_release.yml` (assets uploaded per
  engine).

## What you can still read upstream for

Most of the script-language layer is unchanged: how the `godot` module works, `GArray`/`GDictionary`
proxies, `Signal` / `Callable` semantics, the `default export` requirement, constructor conventions and
the type hints produced by code generation. This site rewrites those topics against this repository's
facts; see the respective pages.
