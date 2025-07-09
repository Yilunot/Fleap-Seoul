<template>
  <div>
    <h3>{{ title }}</h3>
    <div v-if="!users.length">No one to follow.</div>
    <ul>
      <li v-for="u in users" :key="u.id">
        <router-link :to="`/users/${u.id}`">{{ u.username }}</router-link>
        <button v-if="canFollow" @click="onFollow(u.id)">Follow</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps(['users', 'canFollow', 'onFollow', 'title']);
</script>
//Mock data for testing
<script>
export default {
  data() {
    return {
      users: [
        { id: 1, username: 'alice' },
        { id: 2, username: 'bob' },
        { id: 3, username: 'charlie' }
      ]
    }
  }
}
</script>