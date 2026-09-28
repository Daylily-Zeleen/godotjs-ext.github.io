<script setup lang="ts">
/**
 * Search dialog.
 *
 * VitePress' local provider builds one MiniSearch index per locale and exposes
 * it through the `@localSearchIndex` virtual module, but the UI consuming it
 * (`VPLocalSearchBox`) is not part of the public `vitepress` entry, so the dialog
 * is ours. It reuses the very dependency the provider already ships.
 */
import localSearchIndex from "@localSearchIndex";
import { useData, useRouter, withBase } from "vitepress";
import MiniSearch from "minisearch";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

interface SectionResult {
    id: string;
    title: string;
    titles: string[];
    text: string;
}

const { localeIndex } = useData();
const router = useRouter();

const open = ref(false);
const query = ref("");
const results = ref<SectionResult[]>([]);
const indexed = ref(false);
const active = ref(0);

const index = shallowRef<MiniSearch<SectionResult>>();
const zh = computed(() => localeIndex.value === "root");
const placeholder = computed(() => (zh.value ? "搜索文档" : "Search docs"));

async function ensureIndex() {
    if (index.value) return;
    const factory = (localSearchIndex as Record<string, () => Promise<{ default: unknown }>>)[localeIndex.value];
    // The provider hands back miniSearch's *own serialised index* (a
    // `JSON.stringify` of the MiniSearch instance), not a plain record array -
    // `loadJSONString` is the matching entry point on this side.
    const payload = factory ? (await factory()).default : "";
    const built = MiniSearch.loadJSON<SectionResult>(
        typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
        {
            fields: ["title", "titles", "text"],
            storeFields: ["title", "titles"],
            searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 4, titles: 2 } },
        },
    );
    index.value = built;
    indexed.value = true;
}

watch(query, async (value) => {
    active.value = 0;
    if (!value) {
        results.value = [];
        return;
    }
    await ensureIndex();
    results.value = index.value!.search(value).slice(0, 20) as unknown as SectionResult[];
});

function onKeydown(event: KeyboardEvent) {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
    if ((event.key === "/" && !open.value && !typing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        open.value = true;
    } else if (event.key === "Escape") {
        open.value = false;
    }
}

function onPanelKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
        event.preventDefault();
        active.value = Math.min(active.value + 1, results.value.length - 1);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        active.value = Math.max(active.value - 1, 0);
    } else if (event.key === "Enter") {
        const hit = results.value[active.value];
        if (hit) go(hit);
    }
}

function go(hit: SectionResult) {
    open.value = false;
    query.value = "";
    router.go(withBase(hit.id));
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
    <div class="gje-search">
        <button type="button" class="gje-search__trigger" @click="open = true">
            <span class="gje-search__label">{{ placeholder }}</span>
            <kbd>Ctrl K</kbd>
        </button>

        <div v-if="open" class="gje-search__overlay" @click.self="open = false">
            <div class="gje-search__panel" role="dialog" aria-modal="true" @keydown="onPanelKeydown">
                <input
                    v-model="query"
                    class="gje-search__input"
                    :placeholder="placeholder"
                    autocomplete="off"
                    spellcheck="false"
                />
                <p v-if="query && indexed && results.length === 0" class="gje-search__hint">
                    {{ zh ? "没有匹配结果" : "No results found" }}
                </p>
                <ul v-else class="gje-search__list">
                    <li
                        v-for="(hit, i) in results"
                        :key="hit.id"
                        :class="{ 'is-active': i === active }"
                        @mouseenter="active = i"
                        @click="go(hit)"
                    >
                        <a :href="withBase(hit.id)">
                            <span class="gje-search__title">
                                <template v-for="(crumb, j) in [...(hit.titles ?? []), hit.title]" :key="j">
                                    <span v-if="j > 0" class="gje-search__sep">›</span>{{ crumb }}
                                </template>
                            </span>
                            <span class="gje-search__excerpt">{{ (hit as any).text?.slice(0, 160) }}</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
