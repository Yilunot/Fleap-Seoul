<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const email = ref('')
const password = ref('')
const activeTab = ref('login')
const router = useRouter()
const userStore = useUserStore()

function handleLogin() {
  if (userStore.login(email.value, password.value)) {
    router.push('/')
  } else {
    alert('Invalid credentials')
  }
}

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
  <div class="login-box">
    <div class="tabs">
      <button :class="{active: activeTab === 'login'}" @click="activeTab = 'login'">Login</button>
      <button :class="{active: activeTab === 'signup'}" @click="activeTab = 'signup'">Sign Up</button>
    </div>
    <div class="tab-content">
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button v-if="activeTab === 'login'" @click="handleLogin">Login</button>
      <button v-else @click="handleSignup">Create Account</button>
    </div>
  </div>
</template>

<style scoped>
.login-box {
  max-width: 350px;
  margin: 80px auto;
  padding: 2rem 2rem 1.5rem 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.tabs {
  display: flex;
  margin-bottom: 1.5rem;
}
.tabs button {
  flex: 1;
  padding: 0.7rem 0;
  border: none;
  background: #eee;
  color: #333;
  cursor: pointer;
  font-weight: bold;
  border-radius: 8px 8px 0 0;
  transition: background 0.2s;
}
.tabs button.active {
  background: #0524d1;
  color: #fff;
}
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button {
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  border: none;
  background: #2b01e4;
  color: #fff;
  cursor: pointer;
}
button:not(.active):hover {
  opacity: 0.9;
}
</style>