<script setup>
defineProps(['user'])
</script>

<template>
  <div v-if="user">
    <div><strong>{{ user.username }}</strong></div>
    <div>Posts: {{ user.posts }}</div>
    <div>Following: {{ user.following }}</div>
    <div>Followers: {{ user.followers }}</div>
  </div>
</template>