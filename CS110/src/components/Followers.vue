<template>
  <div>
    <h3>{{ title }}</h3>
    <div v-if="!users.length">No one to follow.</div>
    <ul>
      <li v-for="u in users" :key="u.id">
        <router-link :to="`/profile/${u.username}`">{{ u.username }}</router-link>
        <button v-if="canFollow" @click="onFollow(u.id)">Follow</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps(['users', 'canFollow', 'onFollow', 'title']);

</script>