# Project setup

Once the extension is installed, the project still needs a TypeScript compile and type environment.
The editor plugin does that for you.

## 1. Install the preset files

In the Godot editor open **Project -> Tools -> GodotJS-Ext -> Install Project Files** and confirm. The
plugin writes a set of files into the project:

| File | Purpose |
|---|---|
| `tsconfig.json` | TypeScript project config. `outDir = .godot/godotjs_ext`, `typeRoots = ./typings`, `module: node16`, `target: es2022`, `allowJs`, `noEmitOnError: false` |
| `jsconfig.json` | The plain-JavaScript equivalent (`allowJs`) |
| `package.json` | Declares only the `typescript` dependency, used to run `tsc` |
| `node_modules/.gdignore` | Keeps Godot from scanning `node_modules` |
| `typings/.gdignore` | Same, for the type-declaration directory |
| `.godot/godotjs_ext/.gdignore` | Same, for the compile output directory |
| `typings/godot.minimal.d.ts` | Declarations for `godot` / `godot-jsb` / `godot.worker` |
| `typings/godot.mix.d.ts` | Declarations mixing built-in modules and generated types |
| `typings/godot.worker.d.ts` | Declarations for `godot.worker` (absent from Web builds) |
| `typings/jsb.runtime.bundle.d.ts` | The runtime bundle's outward type view |
| `typings/jsb.editor.bundle.d.ts` | The editor bundle's outward type view |
| `.godot/jsb.editor.tools.cjs` and two siblings | The editor's resident tool process (signature and comment-doc extraction) |

> [!IMPORTANT]
> The preset files come from the **editor extension's own embedded copies**, not from a repository
> directory. After upgrading the extension, if you are told the project files should be reinstalled,
> just run the command again.

The tool artifacts (`jsb.editor.tools.cjs` / `jsb.signature.extract.cjs` / `jsb.doc.extract.cjs`) are
installed into the **project data directory** (`.godot/` by default), deliberately separate from the
generated output so the "no matching source means stale" cleanup rule cannot delete them.

## 2. Install the TypeScript toolchain

```bash
cd /path/to/your/project
pnpm install     # or npm install
```

`package.json` only depends on `typescript`. Add third-party libraries (papaparse, for instance) to
that same `package.json` - the runtime treats `node_modules` as a module source.

## 3. Compile

```bash
npx tsc          # one-shot
npx tsc -w       # watch mode
```

Output goes to `.godot/godotjs_ext/`, which is where the runtime loads `.js` and source maps from.
Two editor entry points exist:

- The **Start TSC** button in the bottom **GodotJS-Ext** panel's REPL toolbar (watch mode)
- **Project -> Tools -> GodotJS-Ext -> Generate Types** (below)

## 4. Generate type declarations

The first time you open a project (and after an engine upgrade) the API data and type declarations
must be generated, otherwise `import { Node } from "godot"` cannot resolve.

- Menu: **Project -> Tools -> GodotJS-Ext -> Generate Types**
- Or on the command line (what CI uses):

```bash
godot --headless --editor --path /path/to/your/project --generate-types
```

The editor produces:

- `.godot/.api_dumping` - the binary store of engine class information (the data source behind the
  `godot` module)
- `typings/godot*.gen.d.ts` - type declarations derived from that store

> [!NOTE]
> A fresh checkout (or CI) has no `.godot/.api_dumping` yet, so it must be bootstrapped once:

```bash
# 1. Dump the extension API together with docs
godot --headless --editor --path /path/to/your/project --dump-extension-api-with-docs

# 2. Convert extension_api.json into the binary store
godot --headless --editor --path /path/to/your/project --godotjs-api-generate extension_api.json
```

`--godotjs-api-generate <extension_api.json>` accepts a path relative to the project directory or an
absolute one. The editor menu item **Generate API Data** is the same loop: save scenes, quit, and
relaunch the editor with this argument.

## 5. Code generation (optional)

Besides API declarations the plugin generates types for project resources:

- Each scene -> `gen/godot/**/<Scene>.nodes.gen.ts`, mapping node paths to types
- Each resource -> `gen/godot/**/<res>.gen.ts`, typing what `ResourceLoader.load()` returns
- The generated `.d.ts` land in `typings/`

Tune or disable this under **Project Settings -> godotjs_ext**, e.g. excluding scenes by wildcard:

```ini
[godotjs_ext]

codegen/scene_dts/exclude_path_wildcards=PackedStringArray("res://code_gen_test/ExcludedScene.tscn")
```

## 6. Plain JavaScript works too

TypeScript is not required: pick GodotJSScript as the editor script language and write `.js`. The
`jsconfig.json` with `allowJs` above is for exactly that setup (type hints still come from `typings/`).

## Next

[Your first script](/en/guide/first-script).
