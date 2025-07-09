<template>
    <button @click="logOut" class="logout-button">
        Log Out
    </button>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps(['logOut']);
</script>
