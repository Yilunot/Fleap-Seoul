<template>
  <div>
    <h3>{{ title }}</h3>
    <div v-if="!users.length">No one to follow.</div>
    <ul>
      <li v-for="u in users" :key="u.id">
        <!-- Remove router-link since profile page doesn't exist -->
        <span>{{ u.email }}</span>
        <button v-if="canFollow" @click="onFollow(u.id)">Follow</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps(['users', 'canFollow', 'onFollow', 'title']);
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

button {
  background-color: #0524d1;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

button:hover {
  background-color: #4c599d;
}
</style>