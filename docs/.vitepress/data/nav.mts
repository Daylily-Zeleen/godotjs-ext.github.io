/**
 * The single source of truth for both the top navigation and the sidebar.
 *
 * Every entry carries both locales, so adding a page means adding one line
 * here and two markdown files (`docs/<link>.md` + `docs/en/<link>.md`) - the
 * `check:i18n` script fails the build when only one side exists.
 *
 * `link` is written *without* the `/en` prefix and without `.html`; the config
 * derives the per-locale sidebar from it.
 */

export interface NavItem {
    /** Route-relative link, e.g. `/guide/installation`. */
    link: string;
    zh: string;
    en: string;
}

export interface NavSection {
    /** Section heading in the sidebar. */
    zh: string;
    en: string;
    items: NavItem[];
}

export const sections: NavSection[] = [
    {
        zh: "入门",
        en: "Getting started",
        items: [
            { link: "/", zh: "概览", en: "Overview" },
            { link: "/guide/installation", zh: "安装", en: "Installation" },
            { link: "/guide/project-setup", zh: "工程配置", en: "Project setup" },
            { link: "/guide/first-script", zh: "第一个脚本", en: "Your first script" },
        ],
    },
    {
        zh: "脚本编写",
        en: "Scripting",
        items: [
            { link: "/scripting/modules", zh: "模块与类型", en: "Modules and types" },
            { link: "/scripting/annotations", zh: "注解", en: "Annotations" },
            { link: "/scripting/signals", zh: "信号", en: "Signals" },
        ],
    },
    {
        zh: "运行时",
        en: "Runtime",
        items: [{ link: "/runtime/engines", zh: "JS 引擎", en: "JS engines" }],
    },
    {
        zh: "其他",
        en: "Misc",
        items: [{ link: "/misc/differences", zh: "与上游 GodotJS 的差异", en: "Differences from upstream" }],
    },
];
