<template>
  <button @click="login">Log In</button>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const login = () => {
  router.push('/login');
};
</script>

<style scoped>
button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #369e7a;
}
</style>