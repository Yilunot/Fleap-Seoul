<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { auth } from './firebaseResources'
import { ref, onMounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'

const currentUser = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = {
        email: user.email,
        username: user.email.split('@')[0],
        uid: user.uid
      }
    } else {
      currentUser.value = null
    }
  })
})

async function handleLogout() {
  try {
    await signOut(auth)
    currentUser.value = null
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <header>
    <div class="Navbar-header">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink 
          v-if="currentUser" 
          to="/" 
          @click="handleLogout"
        >
          Logout
        </RouterLink>
        <RouterLink v-else to="/login">Login</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
.Navbar-header {
  background-color: #333;
  padding: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

nav {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

nav a:hover {
  background-color: #555;
}

nav a.router-link-active {
  background-color: #42b983;
}
</style>