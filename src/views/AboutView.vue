<template>
  <FancyList>
    <template #item="{ id, username, likes }">
      <div class="item">
        <p>{{ id}}</p>
        <p>by {{ username }} | {{ likes }} likes</p>
      </div>
    </template>
  </FancyList>
</template>
