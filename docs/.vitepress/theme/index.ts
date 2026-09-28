import type { Theme } from "vitepress";
import HomeCards from "./HomeCards.vue";
import Layout from "./Layout.vue";
import "./style.css";

export default {
    Layout,
    enhanceApp({ app }) {
        // Available to markdown pages without an import; used by the landing
        // page so its links get the deployment base applied.
        app.component("HomeCards", HomeCards);
    },
} satisfies Theme;
