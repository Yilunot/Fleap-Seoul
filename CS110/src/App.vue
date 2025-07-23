<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { auth, db } from './firebaseResources'
import { ref, onMounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const currentUser = ref(null)
const isAdmin = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      await checkAdminStatus(user.uid)
    } else {
      currentUser.value = null
      isAdmin.value = false
    }
  })
})

async function checkAdminStatus(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      isAdmin.value = userDoc.data().isAdmin === true
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    isAdmin.value = false
  }
}

async function handleLogout() {
  try {
    await signOut(auth)
    currentUser.value = null
    isAdmin.value = false
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
  <button 
    v-if="currentUser" 
    @click="handleLogout"
    class="logout-btn"
    type="button"
  >
    Logout
  </button>
  <RouterLink v-else to="/login">Login</RouterLink>
  <RouterLink to="/events">Historical Events</RouterLink>
  <RouterLink v-if="currentUser" to="/my-submissions">My Submissions</RouterLink>
  <RouterLink v-if="isAdmin" to="/admin" class="admin-link">Admin Panel</RouterLink>
</nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
.Navbar-header {
  background-color: #f1eed8d6;
  padding: 10px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: #333;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

nav a:hover,
nav a.router-link-active {
  background-color: #007bff;
  color: white;
}

.admin-link {
  background-color: #dc3545;
  color: white !important;
}

.admin-link:hover {
  background-color: #c82333 !important;
}

nav .logout-btn {
  background: none;
  border: none;
  color: #333;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
  transition: background-color 0.2s;
}

nav .logout-btn:hover {
  background-color: #007bff;
  color: white;
}
</style>