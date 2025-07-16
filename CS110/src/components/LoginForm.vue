<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebaseResources'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

const router = useRouter()
const activeTab = ref('login')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Function to ensure user exists in database
async function ensureUserInDatabase(userCredential) {
  try {
    console.log('🔍 Checking if user exists in database:', userCredential.user.email)
    
    // Check if user document exists
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', userCredential.user.email))
    const existingUsers = await getDocs(q)
    
    if (existingUsers.empty) {
      console.log('👤 User not found in database, creating user document...')
      
      // Create user document in Firestore
      const userData = {
        email: userCredential.user.email,
        feed: [],      // Empty array for user's feed
        followers: [], // Empty array for followers
        following: [], // Empty array for following
        posts: []      // Empty array for posts
      }
      
      console.log('📝 Creating user document:', userData)
      
      const docRef = await addDoc(collection(db, 'users'), userData)
      console.log('✅ User document created with ID:', docRef.id)
      
      // Verify the document was created
      const verifyQuery = await getDocs(q)
      if (verifyQuery.empty) {
        throw new Error('Failed to create user document in database')
      }
      console.log('✅ User document verified in database')
      
    } else {
      console.log('✅ User already exists in database')
    }
  } catch (error) {
    console.error('❌ Error ensuring user in database:', error)
    throw error
  }
}

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('✅ User logged in:', userCredential.user.email)
    
    // Check if user exists in database and add if not
    await ensureUserInDatabase(userCredential)
    
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

async function handleSignup() {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    console.log('🔥 Starting signup process for:', email.value)
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    console.log('✅ Firebase Auth user created:', userCredential.user.uid)
    
    // Ensure user exists in database
    await ensureUserInDatabase(userCredential)
    
    router.push('/')
  } catch (error) {
    console.error('❌ Signup error:', error)
    
    // If Firestore failed but Auth succeeded, delete the auth user
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete()
        console.log('🧹 Cleaned up auth user due to database error')
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError)
      }
    }
    
    errorMessage.value = error.message || 'Signup failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<!-- Template stays exactly the same -->
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
        :disabled="isLoading"
        @keyup.enter="activeTab === 'login' ? handleLogin() : handleSignup()"
      />
      <input 
        v-model="password" 
        type="password" 
        placeholder="Password" 
        :disabled="isLoading"
        @keyup.enter="activeTab === 'login' ? handleLogin() : handleSignup()"
      />
      <button 
        v-if="activeTab === 'login'" 
        @click="handleLogin"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
      <button 
        v-else 
        @click="handleSignup"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Creating Account...' : 'Create Account' }}
      </button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<!-- Styles stay exactly the same -->
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

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

button:hover:not(:disabled) {
  background: #0524d1;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}
</style>