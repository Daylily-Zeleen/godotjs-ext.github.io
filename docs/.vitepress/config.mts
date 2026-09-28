import { defineConfig } from "vitepress";
import { sections } from "./data/nav.mts";

const repository = "https://github.com/Daylily-Zeleen/GodotJS-Ext";
/**
 * Project-page base by default (`https://<user>.github.io/<repo>/`). Override
 * with `DOCS_BASE` when moving to an org/user page or a custom domain - the
 * sources never need to change.
 */
const base = process.env.DOCS_BASE ?? "/godotjs-ext.github.io/";

const linkFor = (prefix: string, link: string) => (link === "/" ? `${prefix}/` || "/" : `${prefix}${link}`);

function sidebar(locale: "zh" | "en") {
    const prefix = locale === "en" ? "/en" : "";
    return sections.map((section) => ({
        text: section[locale],
        items: section.items.map((item) => ({ text: item[locale], link: linkFor(prefix, item.link) })),
    }));
}

function search(locale: "zh" | "en") {
    const zh = locale === "zh";
    return {
        provider: "local" as const,
        options: {
            translations: {
                button: { buttonText: zh ? "搜索文档" : "Search docs", buttonAriaLabel: zh ? "搜索" : "Search" },
                modal: { noResultsText: zh ? "没有匹配结果" : "No results found" },
            },
        },
    };
}

const description = "TypeScript/JavaScript for Godot 4.7+, delivered as a GDExtension.";

export default defineConfig({
    base,
    title: "GodotJS-Ext",
    description,
    head: [["link", { rel: "icon", href: `${base}favicon.svg` }]],
    srcExclude: ["**/README.md"],
    // `headers: true` is what makes each page's heading list part of
    // `page.headers`; the right-hand outline in the custom layout reads it. It
    // must be a top-level `markdown` option - `themeConfig.markdown` is ignored.
    markdown: { headers: true },
    themeConfig: {
        repository,
        search: search("zh"),
    },
    locales: {
        root: {
            label: "简体中文",
            lang: "zh-CN",
            title: "GodotJS-Ext",
            description: "为 Godot 4.7+ 提供 TypeScript/JavaScript 支持（GDExtension 形态）。",
            themeConfig: { sidebar: sidebar("zh"), search: search("zh") },
        },
        en: {
            label: "English",
            lang: "en-US",
            link: "/en/",
            title: "GodotJS-Ext",
            description,
            themeConfig: { sidebar: sidebar("en"), search: search("en") },
        },
    },
});
