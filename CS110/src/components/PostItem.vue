<template>
  <article>
    <header>
      <!-- Remove title since posts don't have titles -->
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
import { defineProps } from 'vue';

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});

// Function to format Firestore timestamp
function formatDate(timestamp) {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp
  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp);
  
  // Format options
  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Use 12-hour format (AM/PM)
  };
  
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
  
  return `${formattedDate} at ${formattedTime}`;
}

// Alternative formatting options:
function formatDateShort(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp);
  
  // Short format: "12/25/2023, 2:30 PM"
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateRelative(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older posts, show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
</script>

<style scoped>
article {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
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