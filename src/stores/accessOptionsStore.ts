import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAccessOptionsStore = defineStore('accessOptionsStore', () => {
    const showAccessOptions  = ref(false);
    const hiContrastOn = ref(false);
    
    function toggleShowAccessOptionsOn() {
            showAccessOptions.value = !showAccessOptions.value;
        }
    function toggleHiContrastOn() {
            hiContrastOn.value = !hiContrastOn.value;
            return { hiContrastOn }
        }
    return { showAccessOptions, hiContrastOn, toggleShowAccessOptionsOn, toggleHiContrastOn }
})
