<script setup>
import PostFeed from '@/components/PostFeed.vue'; 
import Followers from '@/components/Followers.vue';
import LoginButton from '@/components/LoginButton.vue';
</script>

<template>
  <main>
    <LoginButton/>
    <PostFeed />
    <Followers />
  </main>
</template>
