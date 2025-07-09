<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const email = ref('')
const password = ref('')
const router = useRouter()
const userStore = useUserStore()

function handleLogin() {
  if (userStore.login(email.value, password.value)) {
    router.push('/')
  } else {
    alert('Invalid credentials')
  }
}
</script>

<template>
  <div>
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="handleLogin">Login</button>
  </div>
</template>