<script setup lang="ts">
/**
 * Landing-page card grid.
 *
 * Raw `<a href>` in markdown is not rewritten by VitePress (only markdown link
 * syntax is), so the hrefs go through `withBase` here, otherwise they break on a
 * project-page deployment.
 */
import { useData, withBase } from "vitepress";
import { computed } from "vue";

const { localeIndex } = useData();
const en = computed(() => localeIndex.value === "en");

interface Card {
    kicker: string;
    title: string;
    description: string;
    link: string;
}

const zh: Card[] = [
    { kicker: "01", title: "安装", description: "下载按引擎分发的 addons 压缩包，解压进工程。", link: "/guide/installation" },
    { kicker: "02", title: "模块与类型", description: "godot / godot-jsb / godot.worker 分别提供什么。", link: "/scripting/modules" },
    { kicker: "03", title: "注解", description: "导出属性、信号、RPC、静态常量如何声明。", link: "/scripting/annotations" },
    { kicker: "04", title: "JS 引擎", description: "v8、QuickJS-NG、JavaScriptCore、Node.js、浏览器。", link: "/runtime/engines" },
];

const english: Card[] = [
    { kicker: "01", title: "Installation", description: "Download the per-engine addons archive and unpack it into your project.", link: "/en/guide/installation" },
    { kicker: "02", title: "Modules and types", description: "What godot, godot-jsb and godot.worker give you.", link: "/en/scripting/modules" },
    { kicker: "03", title: "Annotations", description: "Declaring exported properties, signals, RPCs and static constants.", link: "/en/scripting/annotations" },
    { kicker: "04", title: "JS engines", description: "v8, QuickJS-NG, JavaScriptCore, Node.js, the browser.", link: "/en/runtime/engines" },
];

const cards = computed(() => (en.value ? english : zh));
</script>

<template>
    <div class="gje-cards">
        <a v-for="card in cards" :key="card.link" class="gje-card" :href="withBase(card.link)">
            <span class="gje-card__kicker">{{ card.kicker }}</span>
            <span class="gje-card__title">{{ card.title }}</span>
            <span class="gje-card__desc">{{ card.description }}</span>
        </a>
    </div>
</template>
