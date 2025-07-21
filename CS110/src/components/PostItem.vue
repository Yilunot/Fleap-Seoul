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
    <footer class="post-actions">
      <div class="reaction-buttons">
        <button 
          @click="handleLike" 
          :class="{ 'active': userReaction === 'like' }"
          class="reaction-btn like-btn"
          :disabled="!currentUser"
        >
          👍 {{ likeCount }}
        </button>
        <button 
          @click="handleDislike" 
          :class="{ 'active': userReaction === 'dislike' }"
          class="reaction-btn dislike-btn"
          :disabled="!currentUser"
        >
          👎 {{ dislikeCount }}
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebaseResources'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const reactions = ref([])
const currentUser = ref(null)

onMounted(async () => {
  if (auth.currentUser) {
    currentUser.value = auth.currentUser
  }
  await loadReactions()
})

const userReaction = computed(() => {
  if (!currentUser.value) return null
  const reaction = reactions.value.find(r => r.userId === currentUser.value.uid)
  return reaction?.type || null
})

const likeCount = computed(() => {
  return reactions.value.filter(r => r.type === 'like').length
})

const dislikeCount = computed(() => {
  return reactions.value.filter(r => r.type === 'dislike').length
})

async function loadReactions() {
  try {
    const reactionsRef = collection(db, `posts/${props.post.id}/reactions`)
    const snapshot = await getDocs(reactionsRef)
    reactions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading reactions:', error)
  }
}

async function handleLike() {
  if (!currentUser.value) return
  
  if (userReaction.value === 'like') {
    await removeReaction()
  } else {
    await addReaction('like')
  }
}

async function handleDislike() {
  if (!currentUser.value) return
  
  if (userReaction.value === 'dislike') {
    await removeReaction()
  } else {
    await addReaction('dislike')
  }
}

async function addReaction(type) {
  try {
    // Remove existing reaction if any
    if (userReaction.value) {
      await removeReaction()
    }
    
    // Add new reaction
    const reactionsRef = collection(db, `posts/${props.post.id}/reactions`)
    await addDoc(reactionsRef, {
      userId: currentUser.value.uid,
      type: type,
      timestamp: new Date()
    })
    
    await loadReactions()
  } catch (error) {
    console.error('Error adding reaction:', error)
  }
}

async function removeReaction() {
  try {
    const reaction = reactions.value.find(r => r.userId === currentUser.value.uid)
    if (reaction) {
      await deleteDoc(doc(db, `posts/${props.post.id}/reactions/${reaction.id}`))
      await loadReactions()
    }
  } catch (error) {
    console.error('Error removing reaction:', error)
  }
}

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

.post-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.reaction-buttons {
  display: flex;
  gap: 8px;
}

.reaction-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.reaction-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.reaction-btn:disabled {
  background: #e9ecef;
  border-color: #dee2e6;
  color: #6c757d;
  cursor: not-allowed;
}

.like-btn.active {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.dislike-btn.active {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}
</style>