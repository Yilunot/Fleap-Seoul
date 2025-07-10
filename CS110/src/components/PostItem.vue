<template>
  <article>
    <header>
      <h2>{{ post.title }}</h2>
      <p>by {{ post.author }} 
        <span v-if="post.date"> | {{ post.date }} | {{ post.time }}</span>
      </p>
    </header>
    <section>
      <p>{{ post.content }}</p>
    </section>
  </article>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
article {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 16px;
  margin-bottom: 16px;
}

header {
  margin-bottom: 12px;
}

h2 {
  margin: 0;
  font-size: 1.5em;
}

p {
  margin: 0;
}
</style>
