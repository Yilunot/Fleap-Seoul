<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useUserStore } from './stores/user.js'
const userStore = useUserStore()
</script>

<template>
  <header>
    <div class="Navbar-header">
     <nav>
  <RouterLink to="/">Home</RouterLink>
  <RouterLink v-if="userStore.user" :to="`/profile/${userStore.user.username}`">Profile</RouterLink>
  <RouterLink v-if="userStore.user" to="/" @click.native="userStore.logout">Logout</RouterLink>
  <RouterLink v-else to="/login">Login</RouterLink>
  <RouterLink v-if="!userStore.user" to="/signup">Sign Up</RouterLink>
    </nav>
    </div>
  </header>
<RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  margin-top: 90px;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 20px;
  position: fixed;
  top: 0;
  left: 1;
  right: 0;
  background-color: rgb(7, 7, 7);

}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

</style>
