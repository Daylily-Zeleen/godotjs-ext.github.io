# 工程配置

装好扩展之后，还需要让工程具备 TypeScript 的编译与类型环境。这一步由编辑器插件代劳。

## 1. 安装预设文件

在 Godot 编辑器里打开 **项目 → 工具 → GodotJS → Install Preset Files**，
确认后插件会在工程内写入一组文件：

| 文件 | 作用 |
|---|---|
| `tsconfig.json` | TypeScript 工程配置。`outDir = .godot/godotjs_ext`、`typeRoots = ./typings`、`module: node16`、`target: es2022`、`allowJs`、`noEmitOnError: false` |
| `jsconfig.json` | 纯 JavaScript 工程的配置（`allowJs`） |
| `package.json` | 只声明 `typescript` 依赖，用来跑 `tsc` |
| `node_modules/.gdignore` | 让 Godot 不去扫描 `node_modules` |
| `typings/.gdignore` | 同上，针对类型声明目录 |
| `.godot/godotjs_ext/.gdignore` | 同上，针对编译输出目录 |
| `typings/godot.minimal.d.ts` | `godot` / `godot-jsb` / `godot.worker` 等模块的声明 |
| `typings/godot.mix.d.ts` | 内置模块与生成类型的混合声明 |
| `typings/type.extension.d.ts` | 类型扩展（如启用） |
| `typings/godot.worker.d.ts` | `godot.worker` 模块声明（Web 构建不含） |
| `typings/jsb.runtime.bundle.d.ts` | 运行时包对外的类型视图 |
| `typings/jsb.editor.bundle.d.ts` | 编辑器包对外的类型视图 |
| `.godot/jsb.editor.tools.cjs` 等三个文件 | 编辑器的常驻工具进程（签名 / 注释文档提取） |

> [!IMPORTANT]
> 预设文件是**从编辑器扩展内置的副本**安装的，不是从仓库目录复制。
> 升级扩展后如果提示「建议重新安装工程文件」，重新执行一次即可。

工具产物（`jsb.editor.tools.cjs` / `jsb.signature.extract.cjs` / `jsb.doc.extract.cjs`）
装在**项目数据目录**（默认 `.godot/`），与其它生成物分开，因此不会被「无对应源即判陈旧」的
清理规则误删。

## 2. 安装 TypeScript 工具链

```bash
cd /path/to/your/project
pnpm install     # 或 npm install
```

`package.json` 只依赖 `typescript`。如果你需要第三方库（例如解析 CSV 的 papaparse），
按常规方式加进同一个 `package.json` 即可 —— 运行时会把 `node_modules` 当作模块源。

## 3. 编译

```bash
npx tsc          # 一次性编译
npx tsc -w       # 监视模式
```

输出到 `.godot/godotjs_ext/`，运行时从那里加载 `.js` 与 source map。
编辑器为此提供了两个入口：

- 底部 **GodotJS** 面板 → REPL 工具栏上的 **Start TSC**（监视模式）
- **项目 → 工具 → GodotJS → Generate Types**（下面）

## 4. 生成类型声明

第一次打开工程（或引擎升级后）需要生成 API 数据与类型声明，否则 `import { Node } from "godot"`
解析不到。

- 菜单：**项目 → 工具 → GodotJS → Generate Types**
- 或命令行（CI 用）：

```bash
godot --headless --editor --path /path/to/your/project --generate-types
```

编辑器会生成：

- `.godot/.api_dumping` —— 引擎类的二进制信息库（运行时解析 `godot` 模块的数据源）
- `typings/godot*.gen.d.ts` —— 从这份数据派生的类型声明

> [!NOTE]
> 全新检出（或 CI）里 `.godot/.api_dumping` 还不存在，必须先引导一次：

```bash
# 1. 导出扩展 API（含文档）
godot --headless --editor --path /path/to/your/project --dump-extension-api-with-docs

# 2. 把 extension_api.json 转成二进制库
godot --headless --editor --path /path/to/your/project --godotjs-api-generate extension_api.json
```

`--godotjs-api-generate <extension_api.json>` 接受相对工程目录的路径或绝对路径。
编辑器菜单里的 **Generate API Data** 就是「保存场景 → 退出 → 用这个参数重启编辑器」的闭环。

## 5. 代码生成（可选）

除 API 声明之外，插件还会为工程资源生成类型：

- 每个场景 → `gen/godot/**/<Scene>.nodes.gen.ts`，给出节点路径到类型的映射
- 每个资源 → `gen/godot/**/<res>.gen.ts`，给出 `ResourceLoader.load()` 的返回类型
- 生成的 `.d.ts` 落在 `typings/`

可以在 **项目设置 → godotjs_ext** 下调整/关闭，例如用通配符排除某些场景：

```ini
[godotjs_ext]

codegen/scene_dts/exclude_path_wildcards=PackedStringArray("res://code_gen_test/ExcludedScene.tscn")
```

## 6. 也可以手写 JS

不装 TypeScript 也能用：把编辑器脚本语言选为 GodotJSScript，写 `.js` 即可。
上面的 `jsconfig.json` 与 `allowJs` 就是为这种工程准备的（类型提示仍来自 `typings/`）。

## 下一步

[第一个脚本](/guide/first-script)。
