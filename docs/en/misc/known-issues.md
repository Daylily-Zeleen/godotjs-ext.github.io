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

## 3. Under node, node-level exceptions do not reach `onerror` right away

**Symptom**: with `use_node=yes`, an exception thrown inside a node timer callback (or any node-level uncaught
exception) reaches the host `onerror` later in the **same engine frame**; when the source is a worker (its own
thread), it waits for the host's next `update()`.

**Why**: these exceptions arrive through the `process.setUncaughtExceptionCaptureCallback` hook, which node calls
from inside an `InternalCallbackScope`. Running the host's `onerror` synchronously there (the user may `terminate()`
that environment) corrupts node's async stack - measured as `AsyncHooks::FailWithCorruptedAsyncStack` followed by
the process exiting.

**Current behaviour**: the hook only stashes the exception; capture and forwarding happen after `PumpEventLoop()`
returns (same frame, outside node's async scope). Same-thread hosts get it in the current frame; cross-thread
sources are queued.

**Not affected**: synchronous entries such as `evaluate` / `importValueSync`, and shadow realm message callbacks,
still throw to the caller synchronously.

