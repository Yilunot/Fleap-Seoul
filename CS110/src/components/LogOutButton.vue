<template>
    <button @click="logOut" class="logout-button">
        Log Out
    </button>
</template>

<script setup>
import { defineProps } from 'vue';
defineProps(['logOut']); 
</script>

<style scoped>
.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
}

.logout-button:hover {
  background-color: #c82333;
}
</style>