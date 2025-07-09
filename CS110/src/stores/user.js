import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  function login(email, password) {
    if (email === 'test@example.com' && password === 'password123') {
      user.value = {
        email,
        username: 'testuser',
        posts: 3,
        following: 2,
        followers: 5,
      }
      return true
    }
    return false
  }
  function logout() {
    user.value = null
  }
  function signup(email, password) {
    user.value = {
      email,
      username: email.split('@')[0],
      posts: 0,
      following: 0,
      followers: 0,
    }
    return true
  }
  return { user, login, logout, signup }
})