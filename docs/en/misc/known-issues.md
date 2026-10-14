# Known issues

Things you can run into in the current version that are not handled yet.

> Last reviewed: 2026-10-14.

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

## 4. A failed script load prints an extra bare line starting with `Uncaught `

**Symptom**: with `use_node=yes` (and on the v8 backend), when a `.ts` / `.js` script throws during load - e.g. an
entry script whose first statement is `throw new Error(...)` - the console shows:

```
WARNING: [jsb][Warning] something went wrong on loading 'res://...'
Uncaught Error: <your message>
Error: <your message>
    at ...
```

The `Uncaught Error: ...` line stands alone, without an `ERROR` / `WARNING` prefix.

**Why**: a failed load is caught in place by `Environment::load()` (`jsb_environment.cpp`), which folds the
exception text into one multi-line log record. On the node / v8 backends the text comes from V8's
`v8::Message::Get()`, and V8 always renders it through the `"Uncaught %"` template
(`MessageTemplate::kUncaughtException`) - **even when the exception was caught by a try/catch**. The newline in the
log message pushes that prefix to the start of a line, producing the bare line. The quickjs / JavaScriptCore
backends read `err.message` instead, so they never show the prefix.

**Impact**: cosmetic only. The exception is handled, `load()` returns its failure code as usual, and runtime
behaviour is unaffected. The side effect is that any tool/script that scans console output line by line and treats
a line starting with `Uncaught ...` as an uncaught exception gets a false positive.

**Current behaviour**: none (not handled). When matching console text line by line, avoid a line-start `^Uncaught`
predicate; use the prefixed form (e.g. `[jsb][Error]`) or decide on the exit code / sentinel line instead.

## 5. The help documentation shows no JS-side functions, constants or annotations

**Symptom**: the editor's help documentation lists the built-in functions, global constants and annotations for
`@GDScript`, while the `@GodotJSScript` section is empty.

**Cause**: those three lists come from the script language's `_get_public_functions()` /
`_get_public_constants()` / `_get_public_annotations()`; this extension returns empty for all three
(`jsb_script_language.h`).

**Deliberate, not a defect**: exposing every global entry in the help page buys very little and makes the page
bloated and hard to read. The C# side does not implement these three either, so this matches it.

**Not affected**: script behaviour, what the annotations actually do, and type declarations / completion do not
depend on these three hooks -- they only feed that one help section.

## 6. On the JavaScriptCore backend, an infinite loop inside a worker / shadow realm cannot be aborted

**Symptom**: with the JavaScriptCore backend (`use_javascriptcore`, macOS / iOS), a script that spins forever inside a
worker or a shadow realm keeps running when the host calls `terminate()` -- the execution is never reclaimed.

**Cause**: aborting a runaway script needs two hooks: an interrupt handler (quickjs installs `JS_SetInterruptHandler`,
v8 / node rely on the engine's own `TerminateExecution`) and `TerminateExecution()` itself. JavaScriptCore exposes no
public interrupt / time-limit API (`JSContextGroupSetExecutionTimeLimit` is private), so `set_as_interruptible()` is a
no-op on that backend (`jsb_jsc_helper.h`) and `TerminateExecution()` only sets a flag that nothing consumes
(`jsb_jsc_isolate.h`).

**Impact**: JavaScriptCore only, and only for a runaway script inside a worker / shadow realm: the host cannot abort
it and the execution stays stuck.

**Current behaviour**: none (not handled). Avoid running scripts that may loop forever inside a worker / shadow realm
on that backend; use the v8 / node / quickjs(-ng) backends when the execution has to be abortable.

**Not affected**: worker / shadow realm on the other three backends -- v8 and node abort through the engine, quickjs
and quickjs-ng through their interrupt callback.
