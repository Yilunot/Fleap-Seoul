<template>
  <div class="post-replies">
    <!-- Add Reply Form -->
    <div v-if="currentUser" class="add-reply-form">
      <div class="reply-input-container">
        <textarea 
          v-model="newReply"
          placeholder="Reply to this post..."
          rows="2"
          class="reply-input"
          :disabled="isSubmitting"
        ></textarea>
        <button 
          @click="submitReply"
          :disabled="!newReply.trim() || isSubmitting"
          class="submit-reply-btn"
        >
          {{ isSubmitting ? 'Posting...' : 'Reply' }}
        </button>
      </div>
    </div>
    
    <div v-else class="login-prompt-replies">
      <p>Please <RouterLink to="/login">log in</RouterLink> to reply to this post.</p>
    </div>
    
    <!-- Replies List -->
    <div v-if="loading" class="loading">
      Loading replies...
    </div>
    
    <div v-else-if="replies.length === 0" class="no-replies">
      <p>No replies yet. Be the first to reply!</p>
    </div>
    
    <div v-else class="replies-list">
      <div class="replies-header">
        <h4>{{ replies.length }} {{ replies.length === 1 ? 'Reply' : 'Replies' }}</h4>
      </div>
      
      <div 
        v-for="reply in sortedReplies" 
        :key="reply.id"
        class="reply-item"
      >
        <div class="reply-header">
          <span class="reply-author">{{ reply.author }}</span>
          <span class="reply-date">{{ formatDate(reply.timestamp) }}</span>
        </div>
        
        <div class="reply-content">
          <p>{{ reply.content }}</p>
        </div>
        
        <div class="reply-actions">
          <button 
            @click="likeReply(reply.id)"
            :class="{ 'active': getUserReplyReaction(reply.id) === 'like' }"
            class="reply-reaction-btn like-btn"
            :disabled="!currentUser"
          >
            👍 {{ getReplyLikeCount(reply.id) }}
          </button>
          
          <button 
            @click="dislikeReply(reply.id)"
            :class="{ 'active': getUserReplyReaction(reply.id) === 'dislike' }"
            class="reply-reaction-btn dislike-btn"
            :disabled="!currentUser"
          >
            👎 {{ getReplyDislikeCount(reply.id) }}
          </button>
          
          <button 
            v-if="currentUser && reply.authorId === currentUser.uid"
            @click="deleteReply(reply.id)"
            class="delete-reply-btn"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
})

// Reactive data
const replies = ref([])
const replyReactions = ref([])
const newReply = ref('')
const currentUser = ref(null)
const loading = ref(true)
const isSubmitting = ref(false)

// Watch for auth state changes
watch(currentUser, (newUser) => {
  if (!newUser) {
    loadReplyReactions()
  }
})

// Computed properties
const sortedReplies = computed(() => {
  return replies.value.sort((a, b) => {
    const aTime = a.timestamp?.seconds || 0
    const bTime = b.timestamp?.seconds || 0
    return aTime - bTime // Oldest first for replies
  })
})

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
  
  await loadReplies()
  await loadReplyReactions()
})

// Load replies for this post
async function loadReplies() {
  try {
    const repliesRef = collection(db, 'postReplies')
    const q = query(
      repliesRef,
      where('postId', '==', props.postId),
      orderBy('timestamp', 'asc')
    )
    
    const snapshot = await getDocs(q)
    replies.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
  } catch (error) {
    console.error('Error loading replies:', error)
    replies.value = []
  } finally {
    loading.value = false
  }
}

// Load reply reactions
async function loadReplyReactions() {
  try {
    const reactionsRef = collection(db, 'postReplyReactions')
    const q = query(reactionsRef, where('postId', '==', props.postId))
    
    const snapshot = await getDocs(q)
    replyReactions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading reply reactions:', error)
    replyReactions.value = []
  }
}

// Submit new reply
async function submitReply() {
  if (!currentUser.value || !newReply.value.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    await addDoc(collection(db, 'postReplies'), {
      postId: props.postId,
      content: newReply.value.trim(),
      author: currentUser.value.email,
      authorId: currentUser.value.uid,
      timestamp: new Date()
    })
    
    newReply.value = ''
    await loadReplies()
    
  } catch (error) {
    console.error('Error submitting reply:', error)
    alert('Failed to submit reply. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Delete reply
async function deleteReply(replyId) {
  if (!confirm('Are you sure you want to delete this reply?')) return
  
  try {
    await deleteDoc(doc(db, 'postReplies', replyId))
    await loadReplies()
    
    // Also delete all reactions for this reply
    const reactionsToDelete = replyReactions.value.filter(r => r.replyId === replyId)
    for (const reaction of reactionsToDelete) {
      await deleteDoc(doc(db, 'postReplyReactions', reaction.id))
    }
    await loadReplyReactions()
    
  } catch (error) {
    console.error('Error deleting reply:', error)
    alert('Failed to delete reply. Please try again.')
  }
}

// Like reply
async function likeReply(replyId) {
  if (!currentUser.value) return
  await toggleReplyReaction(replyId, 'like')
}

// Dislike reply
async function dislikeReply(replyId) {
  if (!currentUser.value) return
  await toggleReplyReaction(replyId, 'dislike')
}

// Toggle reply reaction
async function toggleReplyReaction(replyId, reactionType) {
  try {
    const existingReaction = replyReactions.value.find(r => 
      r.replyId === replyId && r.userId === currentUser.value.uid
    )
    
    if (existingReaction) {
      if (existingReaction.type === reactionType) {
        // Remove reaction if same type
        await deleteDoc(doc(db, 'postReplyReactions', existingReaction.id))
      } else {
        // Change reaction type - delete old and add new
        await deleteDoc(doc(db, 'postReplyReactions', existingReaction.id))
        await addDoc(collection(db, 'postReplyReactions'), {
          postId: props.postId,
          replyId: replyId,
          userId: currentUser.value.uid,
          type: reactionType,
          timestamp: new Date()
        })
      }
    } else {
      // Add new reaction
      await addDoc(collection(db, 'postReplyReactions'), {
        postId: props.postId,
        replyId: replyId,
        userId: currentUser.value.uid,
        type: reactionType,
        timestamp: new Date()
      })
    }
    
    await loadReplyReactions()
    
  } catch (error) {
    console.error('Error toggling reply reaction:', error)
  }
}

// Get user's reaction for a specific reply
function getUserReplyReaction(replyId) {
  if (!currentUser.value) return null
  
  const reaction = replyReactions.value.find(r => 
    r.replyId === replyId && r.userId === currentUser.value.uid
  )
  return reaction?.type || null
}

// Get reply like count
function getReplyLikeCount(replyId) {
  return replyReactions.value.filter(r => 
    r.replyId === replyId && r.type === 'like'
  ).length
}

// Get reply dislike count
function getReplyDislikeCount(replyId) {
  return replyReactions.value.filter(r => 
    r.replyId === replyId && r.type === 'dislike'
  ).length
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  
  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp)
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.post-replies {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.add-reply-form {
  margin-bottom: 1rem;
}

.reply-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reply-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.reply-input:focus {
  outline: none;
  border-color: #007bff;
}

.submit-reply-btn {
  align-self: flex-end;
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.submit-reply-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-reply-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.login-prompt-replies {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.login-prompt-replies a {
  color: #007bff;
  text-decoration: none;
}

.loading, .no-replies {
  text-align: center;
  color: #666;
  padding: 1rem;
  font-style: italic;
}

.replies-header {
  margin-bottom: 1rem;
}

.replies-header h4 {
  color: #333;
  margin: 0;
  font-size: 1rem;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reply-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid #007bff;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reply-author {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.reply-date {
  font-size: 0.8rem;
  color: #666;
}

.reply-content p {
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  color: #444;
  font-size: 0.9rem;
}

.reply-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.reply-reaction-btn {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 15px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.reply-reaction-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.reply-reaction-btn:disabled {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
  cursor: not-allowed;
}

.reply-reaction-btn.like-btn.active {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.reply-reaction-btn.dislike-btn.active {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.delete-reply-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: auto;
}

.delete-reply-btn:hover {
  background: #c82333;
}
</style>