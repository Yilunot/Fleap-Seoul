<template>
  <div v-if="user">
    <div>{{ user.username }}</div>
    <div>Posts: {{ user.posts }}</div>
    <div>Following: {{ user.following }}</div>
    <div>Followers: {{ user.followers }}</div>
  </div>
  <router-link v-else to="/login">Log In</router-link>
</template>

<script setup>
defineProps(['user']);
</script>