<template>
  <article>
    <header>
      <p>by {{ post.author }} 
        <span v-if="post.timestamp"> | {{ formatDate(post.timestamp) }}</span>
      </p>
    </header>
    <section>
      <p>{{ post.content }}</p>
    </section>
  </article>
</template>

<script setup>
defineProps({
  post: {
    type: Object,
    required: true
  }
})

function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp)

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  
  return `${formattedDate} at ${formattedTime}`
}
</script>

<style scoped>
article {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 16px;
  margin-bottom: 16px;
  background: #f1eed8d6;
}

header {
  margin-bottom: 12px;
  color: #666;
  font-size: 0.9em;
}

header p {
  margin: 0;
}

section p {
  margin: 0;
  font-size: 1em;
  line-height: 1.5;
  color: #333;
}
</style>