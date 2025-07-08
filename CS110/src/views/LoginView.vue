<template>
  <div>
    <div>
      <h2>Login</h2>
      <div id="loginForm"> 
        <p>
          <input class="login-input" name="uid" placeholder="Email" v-model="email" /><br>
        </p>
        <p>
          <input name="password" v-model="password" placeholder="Password" type="password"/>
        </p>
        <p>
          <button type="submit" class="login-button" @click="handleLogin">Login</button>
        </p>
        <p>
          <button type="Signup" class="signup-button" @click="$router.push('/signup')">Sign Up</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const password = ref('');

function handleLogin() {
  // Mock login logic
  if (email.value === 'test@example.com' && password.value === 'password123') {
    alert('Login successful!');
    email.value = '';
    password.value = '';
  } else {
    alert('Invalid credentials');
  }
}
</script>