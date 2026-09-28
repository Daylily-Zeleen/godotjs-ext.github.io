# Installation

GodotJS-Ext is a **GDExtension**. You do not replace or rebuild the Godot editor - you drop the
extension's addons directory into your project.

## 1. Prerequisites

- **Godot 4.7 or newer.** The extension declares `compatibility_minimum = 4.7` and its godot-cpp
  bindings are generated against `API_VERSION = "4.7"`; older engines fail to load it because of the ABI.
- An archive extractor (releases are zip files).

## 2. Download

Grab a build from [Releases](https://github.com/Daylily-Zeleen/GodotJS-Ext/releases).

Releases are **split per JS engine**, and each archive carries only the platforms that engine is
actually built for. Inside is a complete `addons/godotjs-ext.daylily-zeleen/` directory (the
per-platform binaries under `bin/<platform>/` plus one `godotjs-ext.gdextension`).

| Engine | Asset | Platforms inside |
|---|---|---|
| V8 (default) | `godotjs-ext-v8-windows-linux-macos-android-ios.zip` | Windows, Linux (x86_64 + arm64), macOS (arm64), Android (arm64 + x86_64), iOS (arm64) |
| QuickJS-NG | `godotjs-ext-qjs-ng-windows-linux-macos-android-ios-web.zip` | the same, plus Web (wasm32, threaded and not) |
| JavaScriptCore | `godotjs-ext-jsc-macos-ios.zip` | macOS (arm64), iOS (arm64) |
| Node.js | `godotjs-ext-node-windows-linux-macos.zip` | Windows, Linux (x86_64), macOS (arm64) |
| Browser | `godotjs-ext-web.zip` | Web (wasm32, threaded and not) |

The `.gdextension` shipped in an archive only declares the files that archive actually contains, so
it works as-is.

> [!NOTE]
> `godotjs-ext-web.zip` contains the browser engine alone. The editor still needs a desktop engine to
> load the extension and run a Web export, so unpack this archive **over** the desktop engine package
> you use (the directory layout is identical, so it merges cleanly), or simply use the QuickJS-NG
> package, which already includes a QuickJS-based web build.

The original QuickJS engine is superseded by QuickJS-NG and is no longer packaged; `use_quickjs=yes`
still builds locally. See [JS engines](/en/runtime/engines) for how to choose.

## 3. Unpack into your project

```bash
# The archive's top level is addons/ - unpack it at the project root
unzip godotjs-ext-v8-windows-linux-macos-android-ios.zip -d /path/to/your/project
```

Result:

```
your-project/
└── addons/
    └── godotjs-ext.daylily-zeleen/
        ├── godotjs-ext.gdextension
        ├── icons/GodotJSScript.svg
        └── bin/<platform>/...
```

## 4. Let Godot load it

Open the project. If the extension is not picked up automatically, confirm it is listed under
**Project -> Project Settings -> Plugins**, or check `project.godot` directly:

```ini
[gdextensions]

paths=["res://addons/godotjs-ext.daylily-zeleen/godotjs-ext.gdextension"]
```

Godot 4 scans `addons/*.gdextension` when a project is opened; restart the editor if it missed it.

## 5. Confirm it loaded

A **GodotJS** panel appears at the bottom of the editor (tabs: REPL and Statistics). Seeing it means
the runtime is up.

## Difference from upstream GodotJS

The upstream installation docs tell you to **download a Godot editor build that already embeds
GodotJS** and put it on your PATH. This repository does not publish engine binaries, so that route
does not apply: you install an extension and keep the editor you have.

## Next

[Project setup](/en/guide/project-setup): install the preset files and wire up the TypeScript toolchain.
