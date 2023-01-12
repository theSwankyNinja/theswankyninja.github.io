<script setup lang="ts">
  import { useAccessOptionsStore } from "@/stores/accessOptionsStore";
  import { storeToRefs } from 'pinia';
  const store = useAccessOptionsStore();
  const { hiContrastOn } = storeToRefs(store);
  const { showAccessOptions } = storeToRefs(store);
  const { toggleShowAccessOptionsOn, toggleHiContrastOn } = store;
</script>

<template>
  <div id="accessibility" class="colorNegative" :class="{hcmNegative: hiContrastOn}">
    <div id='topbuttons'>
      <button class="button" aria-controls="Show accessibility Options" aria-pressed="false" @click.stop="toggleShowAccessOptionsOn()">Click for Accessibility Options </button>
      <a href="#maincontent">
        <button class="button" aria-controls="Skip to main" aria-pressed="false" href="#maincontent">Skip to Main Content</button>
      </a>
    </div>
   <div v-if="showAccessOptions" id="accessoptions" class="colorBeta">
      <span>Hi-Contrast Enabled:{{hiContrastOn}}</span><button @click.stop="toggleHiContrastOn()">Toggle Hi-Contrast Mode</button>
    </div>
  
  </div>
</template>
<style>
#accessibility {
  width: 100%;
}
#topbuttons {
  display: inline-flex;
  justify-content: space-around;
  width: 100%;
}
#topbuttons>.button {
  background-color: whitesmoke;
  color: #660330;
  padding: 3px;
  font-size: 32;
}
#accessoptions {
  border: 5px solid;
  display: flex;
  flex-direction: row;
  float: start;
}
</style>
