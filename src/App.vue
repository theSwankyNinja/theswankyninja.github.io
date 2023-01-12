<script setup lang="ts">
import AccessBox from "@/components/AccessBox.vue";
import AppHeader from "@/components/AppHeader.vue";
import NavBar from "@/components/NavBar.vue";
import FooterBox from "@/components/FooterBox.vue";


</script>

<template>
  <div id="masterbox">
    <access-box />
    <app-header />
    <nav-bar role="nav"/>
    <footer-box />
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: Montserrat, Arial, sans-serif;
  font-weight: 600;

}
#masterbox {
  min-width: 100vw;
  text-align: center;
  width: 100%;
  height: 100%;
  background-color:whitesmoke;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}

.button {
  min-width: 48px;
  min-height: 48px;
  margin: 5px;
  border-radius: 0.5rem;
}

.colorPositive {
  color: #660330;
  background-color: #CDFFFE;
  border-color: #660330;
}
.colorNegative {
  color:#CDFFFE;
  background-color: #660330;
  border-color: #CDFFFE;
}
.hcmPositive {
  color: black;
  background-color: whitesmoke;
  border-color: black;
}
.hcmNegative {
  color: whitesmoke;
  background-color: black;
  border-color: whitesmoke;
}

[role="heading"] {
    justify-self: center;
  }

  #contentbox {
  border: solid 5px;
  width: 95%;
  border-radius: 1em;
  justify-content: center;
  display: flex;
  flex-flow: column wrap;
}
</style>
