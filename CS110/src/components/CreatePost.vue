<template>
  <div>
    <h3>Create Post</h3>
    <textarea
      ref="ta"
      v-model="text"
      @input="resize"
      class="autosize"
      placeholder="What’s on your mind?"
    ></textarea>
    <button @click="submit">Post</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps(['onPost']);
const text = ref('');
const ta = ref(null);

function submit() {
  if (text.value.trim()) {
    props.onPost(text.value);
    text.value = '';
    nextTick(resize);          
  }
}

function resize() {
  const el = ta.value;
  if (!el) return;
  el.style.height = 'auto'; 
  el.style.height = el.scrollHeight + 'px';
}


nextTick(resize);
</script>

<style scoped>
.autosize {
  width: 100%;
  min-height: 3em;    
  max-height: 20em;  
  overflow: hidden; 
  padding: 0.5em;
  resize: none;   
  font-family: inherit;
  font-size: 1em;
  line-height: 1.4;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  margin-top: 0.5em;
}
</style>
