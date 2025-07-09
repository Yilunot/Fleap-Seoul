<template>
  <div>
    <div>
      <h2>Sign Up</h2>
      <div id="signupForm">
        <p>
          <input class="signup-input" name="uid" placeholder="Email" v-model="email" /><br>
        </p>
        <p>
          <input name="password" v-model="password" placeholder="Password" type="password"/>
        </p>
        <p>
          <button type="submit" class="signup-button" @click="handleSignup">Sign Up</button>
        </p>
        <p>
          <button type="Login" class="login-button" @click="$router.push('/login')">Login</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const password = ref('');

function handleSignup() {
  // Mock signup logic
  if (email.value && password.value) {
    alert('Signup successful!');
    email.value = '';
    password.value = '';
  } else {
    alert('Please fill in all fields');
  }
}
</script>
