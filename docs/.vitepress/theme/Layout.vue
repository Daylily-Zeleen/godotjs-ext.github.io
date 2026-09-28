<script setup lang="ts">
/**
 * Site shell.
 *
 * VitePress' own `Layout` is replaced wholesale: the structure here is a
 * persistent left rail plus a narrow reading column with a static outline on
 * the right - no top tab bar, no card-based landing grid, no Material styling.
 * Page content is still rendered by `<Content />`, so the markdown pipeline is
 * untouched.
 */
import { Content, useData, withBase } from "vitepress";
import { computed, onMounted, ref, watch } from "vue";
import LocaleSwitch from "./LocaleSwitch.vue";
import SearchBox from "./SearchBox.vue";
import { sections } from "../data/nav.mts";

const { page, localeIndex, site } = useData();

const locale = computed(() => (localeIndex.value === "en" ? "en" : "zh"));
const home = computed(() => page.value.relativePath === "index.md" || page.value.relativePath === "en/index.md");
const homeLink = computed(() => withBase(locale.value === "en" ? "/en/" : "/"));

/** `relativePath` of the page a nav entry points at, for the active marker. */
const pageOf = (link: string) => (link === "/" ? "index.md" : `${link.slice(1)}.md`);

const groups = computed(() =>
    sections.map((section) => ({
        text: section[locale.value],
        items: section.items.map((item) => ({
            text: item[locale.value],
            // Links in the data file are written once, without a locale prefix;
            // the locale and the deployment base are applied here so the two
            // trees cannot drift apart and project-page hosting keeps working.
            link: withBase((locale.value === "en" ? "/en" : "") + (item.link === "/" ? "/" : item.link)),
            active: page.value.relativePath === (locale.value === "en" ? `en/${pageOf(item.link)}` : pageOf(item.link)),
        })),
    })),
);

const repository = computed(() => (site.value.themeConfig as any)?.repository as string | undefined);

/**
 * Headings for the right-hand outline. VitePress nests them under `children`
 * (`markdown.headers: true` in the config), which this flattens back to levels.
 */
const outline = computed(() => {
    const flat: { level: number; title: string; slug: string }[] = [];
    const visit = (headers: readonly any[]) => {
        for (const header of headers ?? []) {
            flat.push({ level: header.level, title: header.title, slug: header.slug });
            visit(header.children);
        }
    };
    visit(page.value.headers as any);
    return flat;
});

const theme = ref<"dark" | "light">("dark");
const railOpen = ref(false);

function applyTheme(next: "dark" | "light") {
    theme.value = next;
    // The palette lives in custom properties consumed by `body`/`html`, so the
    // class has to sit on the root element - a class on the wrapper would only
    // override the properties for its own subtree.
    document.documentElement.classList.toggle("gje--light", next === "light");
}

function toggleTheme() {
    applyTheme(theme.value === "dark" ? "light" : "dark");
    try {
        localStorage.setItem("gje-theme", theme.value);
    } catch {
        /* private mode */
    }
}

watch(
    () => page.value.relativePath,
    () => {
        railOpen.value = false;
    },
);

onMounted(() => {
    let stored: string | null = null;
    try {
        stored = localStorage.getItem("gje-theme");
    } catch {
        /* private mode */
    }
    applyTheme(stored === "light" ? "light" : "dark");
});
</script>

<template>
    <div class="gje" :class="`gje--${theme}`">
        <a class="gje-skip" href="#gje-content">{{ locale === "en" ? "Skip to content" : "跳到正文" }}</a>

        <header class="gje-head">
            <button class="gje-head__toggle" type="button" @click="railOpen = !railOpen" aria-label="Menu">
                <span></span><span></span><span></span>
            </button>
            <a class="gje-head__brand" :href="homeLink">
                <span class="gje-head__prompt">$</span>
                <span class="gje-head__name">GodotJS-Ext</span>
                <span class="gje-head__caret" aria-hidden="true"></span>
            </a>
            <div class="gje-head__tools">
                <SearchBox />
                <LocaleSwitch />
                <button class="gje-head__theme" type="button" @click="toggleTheme" aria-label="Toggle theme">
                    {{ theme === "dark" ? "◐" : "◑" }}
                </button>
            </div>
        </header>

        <div class="gje-body">
            <nav class="gje-rail" :class="{ 'is-open': railOpen }">
                <div v-for="group in groups" :key="group.text" class="gje-rail__group">
                    <p class="gje-rail__title">{{ group.text }}</p>
                    <ul>
                        <li v-for="item in group.items" :key="item.link">
                            <a :href="item.link" :class="{ 'is-active': item.active }">
                                {{ item.text }}
                            </a>
                        </li>
                    </ul>
                </div>
                <p v-if="repository" class="gje-rail__foot">
                    <a :href="repository" target="_blank" rel="noreferrer">repository</a>
                </p>
            </nav>

            <main id="gje-content" class="gje-main">
                <Content class="gje-doc" />

                <aside v-if="!home && outline.length" class="gje-outline">
                    <p class="gje-outline__title">{{ locale === "en" ? "On this page" : "本页目录" }}</p>
                    <ul>
                        <li v-for="header in outline" :key="header.slug" :class="`is-l${header.level}`">
                            <a :href="`#${header.slug}`">{{ header.title }}</a>
                        </li>
                    </ul>
                </aside>
            </main>
        </div>

        <footer class="gje-foot">
            <span>GodotJS-Ext</span>
            <span class="gje-foot__sep">·</span>
            <span>{{ page.title }}</span>
        </footer>
    </div>
</template>
