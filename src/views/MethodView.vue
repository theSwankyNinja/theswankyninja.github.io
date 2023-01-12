<!-- eslint-disable vue/no-useless-template-attributes -->
<script setup lang="ts">

</script>

<template>
<h2 aria-level="2">Methods</h2>
<h2 aria-level="2">Current</h2>

<h3 aria-level="3">Conditional Rendering</h3>
<p>Conditional rendering can be used to toggle visibility. Here it is employed to initially hide advanced accessibility features. This allows accessibility options to be anchored at the top of the page, where they are easy to locate, without obstructing the page flow for users who don't want or need them</p>

<h3 aria-level="3">Dynamic Classes</h3>
<p>Vue's ability to seamlessly alter CSS classes is leveraged to alter the rendering of individual page elements. 
While many users benefit from having larger buttons that are easier to see and press, 
a user with a limited field of vision or who uses screen enlargement might find the larger buttons disruptive. 
Being able to alternate between one or more options for an element helps the site meet a variety of needs simultaneously with a minimum of code.</p>

<h3 aria-level="3">useTitle from vueUse</h3>
<p>While vueUse provides a tremendous number of useful functions, the site currently uses only useTitle. The title is dynamically updated with the name of the current tab panel.</p>
<p>Currently the page utilizes Vue Router to approximate the ARIA <a href="https://www.w3.org/WAI/ARIA/apg/example-index/tabs/tabs-manual.html">tablist format</a>. 
  While this allows the page to present in a familiar format, I'm currently evaluating whether or not this could be better accomplished using a combination of dynamic classes and conditional rendering. 
  The page as is cannot properly manage focus or accommodate the recommended bypass links.
</p>

<h2 aria-level="2">Planned</h2>

<ul>
  <li>Add dynamic button classes</li>
  <li>Use vueUse to add accessible alerts/audio feedback</li>
  <li>Make methods page to display only one set of methods at a time</li>
  <li>Create usable functions to manage focus and ARIA pressed state</li>
  <li>Rectify all the ARIA labels, preferably by using dynamic HTML attributes</li>
  <li>Add CSS styling for all the new content</li>
  <li>Use Vue templating to help simplify extensive HTML attribution</li>
</ul>

</template>
<style>
p { width: 90%;
    font-size: 1.5rem;
    }
</style>
