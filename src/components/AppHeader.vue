<script setup lang="ts">
  import { useAccessOptionsStore } from "@/stores/accessOptionsStore";
  import { storeToRefs } from 'pinia';
  const store = useAccessOptionsStore();
  const { hiContrastOn } = storeToRefs(store);
</script>
<template>
  <a class="bypass" href="#maincontent">Skip to main content</a>
  <header id="banner" class="colorNegative" :class="{hcmNegative: hiContrastOn}">
      <h1 id="main-title" role="heading" aria-label="element.innerHTML" aria-level="1">Accessibility Using Vue.js</h1>
  </header>

</template>
<style scoped>
  #banner {
    border: solid 5px;
    display: inline-flex;
    flex-flow: row nowrap;
    justify-self: center;
    text-align: center;
    width: 65%;
    min-height: 50px;
    border-radius: 3em;
  }
  #main-title {
    align-self: center;
    margin: auto auto;
  }
 
</style>
