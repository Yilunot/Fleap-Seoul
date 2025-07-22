<template>
  <div class="events-view">
    <EventTimeline />
  </div>
</template>

<script setup>
import EventTimeline from '../components/EventTimeLine.vue'
</script>

<style scoped>
.events-view {
  min-height: 100vh;
  background: #fff;
}
</style>