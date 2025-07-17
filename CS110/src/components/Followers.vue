<template>
  <div>
    <h3>{{ title }}</h3>
    <div v-if="!users.length">No one to follow.</div>
    <ul v-else>
      <li v-for="u in users" :key="u.id">
        <span 
          class="user-link" 
          @click="navigateToProfile(u)"
        >
          {{ u.email }}
        </span>
        <button v-if="canFollow" @click="onFollow(u.id)">Follow</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps(['users', 'canFollow', 'onFollow', 'onUserClick', 'title']);

function navigateToProfile(user) {
  console.log('Navigating to profile for user:', user.id)
  router.push(`/user/${user.id}`)
}
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
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}

li:hover {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.user-link {
  cursor: pointer;
  color: #000102;
  transition: all 0.2s ease;
  flex-grow: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.user-link:hover {
  color: #2b6cb0;
  background-color: rgba(66, 153, 225, 0.1);
  transform: translateX(2px);
}

button {
  background: linear-gradient(135deg, #000000 0%, #3182ce 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-left: 0.5rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

button:hover {
  background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:active {
  transform: translateY(0);
}

h3 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}
</style>