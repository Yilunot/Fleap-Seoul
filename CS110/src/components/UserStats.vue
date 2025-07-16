<script setup>
defineProps(['user'])
</script>

<template>
  <div v-if="user">
    <div><strong>{{ user.username }}</strong></div>
    <div>Posts: {{ user.posts || 0 }}</div>
    <div>Following: {{ user.following || 0 }}</div>
    <div>Followers: {{ Array.isArray(user.followers) ? user.followers.length : (user.followers || 0) }}</div>
  </div>
  <div v-else>
    <span>Not logged in</span>
  </div>
</template>