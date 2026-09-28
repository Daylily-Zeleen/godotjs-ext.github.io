/**
 * The local search provider (enabled by `themeConfig.search.provider = "local"`)
 * exposes its per-locale MiniSearch records through this virtual module. Neither
 * the module nor its shape is part of VitePress' public types.
 */
declare module "@localSearchIndex" {
    // Each loader resolves to the locale's serialised MiniSearch records.
    const locales: Record<string, () => Promise<{ default: string | unknown[] }>>;
    export default locales;
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
