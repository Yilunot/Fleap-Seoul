<script setup>
import { defineProps } from 'vue'
import PostItem from './PostItem.vue'

const props = defineProps({
  posts: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="post-feed">
    <PostItem v-for="post in posts" :key="post.id" :post="post" />
  </div>
</template>

<style scoped>
.post-feed {
  margin-top: 20px;
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>