<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const email = ref('')
const password = ref('')
const router = useRouter()
const userStore = useUserStore()

function handleSignup() {
  if (email.value && password.value) {
    userStore.signup(email.value, password.value)
    router.push('/')
  } else {
    alert('Please fill in all fields')
  }
}
</script>

<template>
  <div>
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="handleSignup">Sign Up</button>
  </div>
</template>