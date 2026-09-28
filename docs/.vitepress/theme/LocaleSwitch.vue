<script setup lang="ts">
/**
 * Locale switcher.
 *
 * VitePress only ships one for its default theme, and we own the header, so
 * the mapping lives here: the leading `en/` segment of the page's source path
 * is swapped and the rest kept, so switching language stays on the same page
 * instead of bouncing back to the landing page.
 */
import { useData, useRouter, withBase } from "vitepress";
import { computed } from "vue";

const { site, localeIndex, page } = useData();
const router = useRouter();

const locales = computed(() =>
    Object.entries(site.value.locales ?? {}).map(([key, value]) => ({
        key,
        label: value.label ?? key,
        prefix: key === "root" ? "" : `/${key}`,
    })),
);

function linkFor(prefix: string) {
    const source = page.value.relativePath.replace(/\.md$/, "");
    const stripped = source.replace(/^en\//, "");
    const slug = stripped === "index" ? "" : `/${stripped}`;
    return withBase(`${prefix}${slug || "/"}`);
}

function onSelect(event: Event) {
    const key = (event.target as HTMLSelectElement).value;
    const entry = locales.value.find((locale) => locale.key === key);
    if (entry) router.go(linkFor(entry.prefix));
}
</script>

<template>
    <label class="gje-locale">
        <select :value="localeIndex" @change="onSelect" aria-label="Language">
            <option v-for="locale in locales" :key="locale.key" :value="locale.key">
                {{ locale.label }}
            </option>
        </select>
    </label>
</template>
