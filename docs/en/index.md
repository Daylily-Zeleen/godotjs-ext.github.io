---
title: GodotJS-Ext
---

# GodotJS-Ext

**TypeScript / JavaScript scripting for Godot 4.7+, shipped as a GDExtension.**

GodotJS-Ext lets you write ordinary TypeScript: classes that extend Godot objects, `_ready()` doing
real work, exported properties showing up in the inspector, breakpoints in Chrome or VS Code. The
difference is that it is **a GDExtension** - drop it into any Godot 4.7+ project instead of replacing
the engine itself.

<HomeCards />

## Requirements

| | |
|---|---|
| Godot | **4.7 or newer**. The extension declares `compatibility_minimum = 4.7` and its godot-cpp bindings are generated against `API_VERSION = "4.7"`; older engines cannot load it because of the ABI. |
| Platforms | Windows / Linux / macOS (desktop), Android, iOS, Web. The exact pairings are in [JS engines](/en/runtime/engines). |
| Optional | TypeScript projects need Node.js and a package manager to compile `.ts`. Plain JavaScript projects do not. |

> [!IMPORTANT]
> GodotJS-Ext publishes **addons archives only** - never a Godot editor with the plugin baked in.
> Use the Godot 4.7+ editor you already have.

## Quick start

```bash
# 1. Grab the archive matching your engine/platform and unpack it at the project root
#    (it contains the full addons/godotjs-ext.daylily-zeleen/ tree)
unzip godotjs-ext-v8-windows-linux-macos-android-ios.zip -d /path/to/your/project

# 2. Open the project, then use the GodotJS bottom panel -> Install Preset Files
# 3. Install the TS toolchain and compile
cd /path/to/your/project
pnpm install
npx tsc
```

Details in [Installation](/en/guide/installation) and [Project setup](/en/guide/project-setup).

## Features

- Godot `ScriptLanguage` integration: script classes, hot reload, running in the editor
- Multiple engines: V8 (default), QuickJS-NG, JavaScriptCore, Node.js, the browser's host JS
- An in-editor REPL and a runtime statistics panel
- Source comments become in-editor script documentation
- Generated type hints: scene nodes, resource types, the return type of `ResourceLoader.load()`
- Static bindings: selectable `binding_mode=static|shared|dynamic`
- Workers and ShadowRealm (experimental)
- Interop with GDScript: `@tool`, exported properties, signals, static members

## Relationship to upstream GodotJS

GodotJS-Ext started from [godotjs/GodotJS](https://github.com/godotjs/GodotJS) but both its
distribution form and its implementation have since diverged: upstream is an **engine module** (you
rebuild the engine), this repository is a **GDExtension** (you install it into an existing editor).
Engine support, the build flow, the editor menus and the release layout all differ. The itemised
comparison is [Differences from upstream](/en/misc/differences).

## License

The repository root `LICENSE` is **GNU LGPL 2.1**. Third-party components under `third/` keep their
own upstream licenses.
