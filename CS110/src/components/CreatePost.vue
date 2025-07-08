<template>
  <div>
    <h3>Create Post</h3>
    <textarea v-model="text" />
    <button @click="submit">Post</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps(['onPost']);
const text = ref('');
function submit() {
  if (text.value.trim()) {
    props.onPost(text.value);
    text.value = '';
  }
}
</script>