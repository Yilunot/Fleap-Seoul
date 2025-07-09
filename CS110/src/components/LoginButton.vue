<template>
  <div class="login-button">
    <button @click="login">Log In</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const login = () => {
  router.push('/login');
};
</script>

<style scoped>

.login-button {
  display: flex;
  justify-content: left;
  margin-top: 20px;
}
button {
  background-color: #0c5fe4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}


button:hover {
  background-color: #4c599d;
}
</style>