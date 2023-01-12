<script setup lang="ts">
  import { useAccessOptionsStore } from "@/stores/accessOptionsStore";
  import { storeToRefs } from 'pinia';
  const store = useAccessOptionsStore();
  const { hiContrastOn } = storeToRefs(store);
</script>
<template>
  <div id="footer" class="colorNegative" :class="{hcmNegative: hiContrastOn}">
    <p>&copy;? 2022 S. Kyle McKenzie</p>
  </div>
</template>

<style>
#footer {
  width: 100%;
  display: flex;
  justify-content: center;
}

</style>
