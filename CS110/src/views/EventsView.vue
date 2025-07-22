<template>
  <div class="events-view">
    <EventTimeLine />
  </div>
</template>

<script setup>
import EventTimeLine from '../components/EventTimeLine.vue'
</script>

<style scoped>
.events-view {
  min-height: 100vh;
  background: #fff;
}
</style>