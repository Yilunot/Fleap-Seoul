<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { auth, db } from '../firebaseResources'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'

const props = defineProps(['post'])

const reactions = ref([])
const currentUser = ref(null)

// Watch for auth state changes
watch(currentUser, (newUser) => {
  if (!newUser) {
    // User logged out - clear reactions and reload
    reactions.value = []
    loadReactions()
  }
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

onMounted(() => {
  // Watch for auth state changes
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    // Reload reactions when auth state changes
    loadReactions()
  })
  
  loadReactions()
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
    reactions.value = []
  }
}

async function handleLike() {
  if (!currentUser.value) {
    alert('Please log in to react to posts')
    return
  }
  
  if (userReaction.value === 'like') {
    await removeReaction()
  } else {
    await addReaction('like')
  }
}

async function handleDislike() {
  if (!currentUser.value) {
    alert('Please log in to react to posts')
    return
  }
  
  if (userReaction.value === 'dislike') {
    await removeReaction()
  } else {
    await addReaction('dislike')
  }
}

async function addReaction(type) {
  try {
    // IMPORTANT: Remove existing reaction first to prevent duplicates
    const existingReaction = reactions.value.find(r => r.userId === currentUser.value.uid)
    if (existingReaction) {
      await deleteDoc(doc(db, `posts/${props.post.id}/reactions`, existingReaction.id))
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
      await deleteDoc(doc(db, `posts/${props.post.id}/reactions`, reaction.id))
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
      <!-- Show login prompt when not authenticated -->
      <div v-if="!currentUser" class="login-prompt">
      </div>
    </footer>
  </article>
</template>

<style scoped>
article {
  border: 1px solid #e90000;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff;
  color: black;
}

header p {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

section p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.post-actions {
  border-top: 1px solid #eee;
  padding-top: 0.5rem;
}

.reaction-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.reaction-btn {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.reaction-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.reaction-btn:disabled {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
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

.login-prompt {
  color: #666;
  font-style: italic;
  text-align: center;
}
</style>