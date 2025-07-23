<template>
  <div class="event-comments">
    <h3>Modern Interpretations & Discussion</h3>
    <p class="comments-subtitle">Share your thoughts about this historical event</p>
    
    <!-- Add Comment Form -->
    <div v-if="currentUser" class="add-comment-form">
      <div class="comment-input-container">
        <textarea 
          v-model="newComment"
          placeholder="Share your interpretation or thoughts about this event..."
          rows="3"
          class="comment-input"
        ></textarea>
        <button 
          @click="submitComment"
          :disabled="!newComment.trim() || isSubmitting"
          class="submit-comment-btn"
        >
          {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
    </div>
    
    <div v-else class="login-prompt">
      <p>Please <RouterLink to="/login">log in</RouterLink> to join the discussion.</p>
    </div>
    
    <!-- Comments List -->
    <div v-if="loading" class="loading">Loading comments...</div>
    
    <div v-else-if="comments.length === 0" class="no-comments">
      <p>No comments yet. Be the first to share your thoughts!</p>
    </div>
    
    <div v-else class="comments-list">
      <div 
        v-for="comment in sortedComments" 
        :key="comment.id"
        class="comment-item"
      >
        <div class="comment-header">
          <span class="comment-author">{{ comment.userEmail }}</span>
          <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
        </div>
        
        <div class="comment-content">
          <p>{{ comment.content }}</p>
        </div>
        
        <!-- Comment Reactions -->
        <div class="comment-reactions">
          <button 
            @click="handleCommentLike(comment)"
            :class="{ 'active': getUserReaction(comment.id) === 'like' }"
            class="reaction-btn like-btn"
            :disabled="!currentUser"
          >
            👍 {{ getCommentLikeCount(comment.id) }}
          </button>
          
          <button 
            @click="handleCommentDislike(comment)"
            :class="{ 'active': getUserReaction(comment.id) === 'dislike' }"
            class="reaction-btn dislike-btn"
            :disabled="!currentUser"
          >
            👎 {{ getCommentDislikeCount(comment.id) }}
          </button>
          
          <!-- Delete button for comment author -->
          <button 
            v-if="currentUser && comment.userId === currentUser.uid"
            @click="deleteComment(comment.id)"
            class="delete-btn"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'

const props = defineProps({
  eventId: {
    type: String,
    required: true
  }
})

const comments = ref([])
const commentReactions = ref([])
const loading = ref(true)
const currentUser = ref(null)
const newComment = ref('')
const isSubmitting = ref(false)

const sortedComments = computed(() => {
  return comments.value.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0
    const bTime = b.createdAt?.seconds || 0
    return bTime - aTime // Newest first
  })
})

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
  
  await loadComments()
  await loadCommentReactions()
})

async function loadComments() {
  try {
    const commentsRef = collection(db, 'eventComments')
    const q = query(
      commentsRef,
      where('eventId', '==', props.eventId),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    comments.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    loading.value = false
  }
}

async function loadCommentReactions() {
  try {
    const reactionsRef = collection(db, 'eventCommentReactions')
    const q = query(reactionsRef, where('eventId', '==', props.eventId))
    
    const snapshot = await getDocs(q)
    commentReactions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading comment reactions:', error)
  }
}

async function submitComment() {
  if (!currentUser.value || !newComment.value.trim()) return
  
  isSubmitting.value = true
  
  try {
    await addDoc(collection(db, 'eventComments'), {
      eventId: props.eventId,
      userId: currentUser.value.uid,
      userEmail: currentUser.value.email,
      content: newComment.value.trim(),
      createdAt: new Date()
    })
    
    newComment.value = ''
    await loadComments()
    
  } catch (error) {
    console.error('Error submitting comment:', error)
    alert('Failed to post comment. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return
  
  try {
    await deleteDoc(doc(db, 'eventComments', commentId))
    await loadComments()
    
    // Also delete all reactions for this comment
    const reactionsToDelete = commentReactions.value.filter(r => r.commentId === commentId)
    for (const reaction of reactionsToDelete) {
      await deleteDoc(doc(db, 'eventCommentReactions', reaction.id))
    }
    await loadCommentReactions()
    
  } catch (error) {
    console.error('Error deleting comment:', error)
    alert('Failed to delete comment. Please try again.')
  }
}

async function handleCommentLike(comment) {
  if (!currentUser.value) return
  
  const existingReaction = commentReactions.value.find(r => 
    r.commentId === comment.id && r.userId === currentUser.value.uid
  )
  
  if (existingReaction) {
    if (existingReaction.type === 'like') {
      // Remove like
      await deleteDoc(doc(db, 'eventCommentReactions', existingReaction.id))
    } else {
      // Change dislike to like
      await deleteDoc(doc(db, 'eventCommentReactions', existingReaction.id))
      await addCommentReaction(comment.id, 'like')
    }
  } else {
    // Add new like
    await addCommentReaction(comment.id, 'like')
  }
  
  await loadCommentReactions()
}

async function handleCommentDislike(comment) {
  if (!currentUser.value) return
  
  const existingReaction = commentReactions.value.find(r => 
    r.commentId === comment.id && r.userId === currentUser.value.uid
  )
  
  if (existingReaction) {
    if (existingReaction.type === 'dislike') {
      // Remove dislike
      await deleteDoc(doc(db, 'eventCommentReactions', existingReaction.id))
    } else {
      // Change like to dislike
      await deleteDoc(doc(db, 'eventCommentReactions', existingReaction.id))
      await addCommentReaction(comment.id, 'dislike')
    }
  } else {
    // Add new dislike
    await addCommentReaction(comment.id, 'dislike')
  }
  
  await loadCommentReactions()
}

async function addCommentReaction(commentId, type) {
  try {
    await addDoc(collection(db, 'eventCommentReactions'), {
      eventId: props.eventId,
      commentId: commentId,
      userId: currentUser.value.uid,
      type: type,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error adding comment reaction:', error)
  }
}

function getUserReaction(commentId) {
  if (!currentUser.value) return null
  
  const reaction = commentReactions.value.find(r => 
    r.commentId === commentId && r.userId === currentUser.value.uid
  )
  return reaction?.type || null
}

function getCommentLikeCount(commentId) {
  return commentReactions.value.filter(r => 
    r.commentId === commentId && r.type === 'like'
  ).length
}

function getCommentDislikeCount(commentId) {
  return commentReactions.value.filter(r => 
    r.commentId === commentId && r.type === 'dislike'
  ).length
}

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
.event-comments {
  border-top: 2px solid #007bff;
  padding-top: 30px;
}

.event-comments h3 {
  color: #333;
  margin-bottom: 5px;
}

.comments-subtitle {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 30px;
}

.add-comment-form {
  margin-bottom: 30px;
}

.comment-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-input {
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.comment-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.submit-comment-btn {
  align-self: flex-end;
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-comment-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-comment-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
}

.login-prompt a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.loading, .no-comments {
  text-align: center;
  padding: 40px;
  color: #666;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 3px solid #007bff;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: bold;
  color: #333;
}

.comment-date {
  font-size: 0.8em;
  color: #666;
}

.comment-content p {
  margin: 0;
  line-height: 1.5;
  color: #444;
}

.comment-reactions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.reaction-btn {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8em;
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

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8em;
  margin-left: auto;
}

.delete-btn:hover {
  background: #c82333;
}
</style>