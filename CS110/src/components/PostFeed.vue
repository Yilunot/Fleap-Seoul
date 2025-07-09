<template>
  <div class="post-feed">
    <PostItem v-for="post in posts" :key="post.id" :post="post" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PostItem from './PostItem.vue';
// Mock data for posts
const posts = ref([
  { id: 1, author: 'User1', date: '2023-01-01', content: 'Post content 1' },
  { id: 2, author: 'User2', date: '2023-01-02', content: 'Post content 2' },
]);
</script>

<style scoped>
.post-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
s