# Known issues

Things you can run into in the current version that are not handled yet.

> Last reviewed: 2026-10-05.

## 1. The editor shows no module dependencies for scripts

**Symptom**: `.ts` / `.js` scripts appear dependency-free in the editor's dependency graph, the dependency dock and
`ResourceLoader.get_dependencies()`.

**Impact**: editing an `import`ed module does not trigger a re-scan or re-import of the scripts that depend on it.

**Not affected**: export packaging and the runtime are fine.

## 2. Autoloads cannot be used by name in JS/TS

**Symptom**: GDScript can use an autoload's name directly (e.g. `_Config`); JS/TS cannot.

**Workaround**: take the node from the scene tree - `get_node("/root/<name>")`. Engine singletons are unaffected:
keep using `import { ... } from "godot"`.
