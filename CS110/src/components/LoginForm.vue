<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebaseResources'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc } from 'firebase/firestore'

const router = useRouter()
const activeTab = ref('login')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/')
  } catch (error) {
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
  }
}

async function handleSignup() {
  errorMessage.value = ''
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    
    // Create user document with required Firestore structure
    await addDoc(collection(db, 'users'), {
      email: userCredential.user.email,
      feed: [],      // Empty array for user's feed
      followers: [], // Empty array for followers
      following: [], // Empty array for following
      posts: []      // Empty array for posts
    })
    
    router.push('/')
  } catch (error) {
    errorMessage.value = error.message || 'Signup failed. Please try again.'
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
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email" 
        @keyup.enter="activeTab === 'login' ? handleLogin() : handleSignup()"
      />
      <input 
        v-model="password" 
        type="password" 
        placeholder="Password" 
        @keyup.enter="activeTab === 'login' ? handleLogin() : handleSignup()"
      />
      <button v-if="activeTab === 'login'" @click="handleLogin">Login</button>
      <button v-else @click="handleSignup">Create Account</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-box {
  max-width: 350px;
  margin: 80px auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  gap: 1px;
}

.tabs button {
  flex: 1;
  padding: 0.7rem 0;
  border: none;
  background: #eee;
  color: #333;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.tabs button:first-child {
  border-radius: 8px 0 0 8px;
}

.tabs button:last-child {
  border-radius: 0 8px 8px 0;
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
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #0524d1;
}

button {
  padding: 0.8rem;
  border-radius: 4px;
  border: none;
  background: #2b01e4;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

button:hover {
  background: #0524d1;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}
</style>