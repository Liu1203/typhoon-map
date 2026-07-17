<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app"

onLaunch(() => {
  console.log("App launched")
})
</script>

<style>
@import "@/styles/variables.css";
@import "@/styles/animations.css";

page {
  background-color: var(--color-bg);
  font-family: var(--font-family-base);
  color: var(--color-ink);
  height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--color-bg);
}

view, text, scroll-view {
  box-sizing: border-box;
}
</style>
