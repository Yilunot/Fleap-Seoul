<template>
  <div class="submissions-view">
    <h2>My Event Submissions</h2>
    
    <div v-if="loading" class="loading">Loading your submissions...</div>
    
    <div v-else-if="!currentUser" class="error-state">
      <p>Please log in to view your submissions.</p>
      <RouterLink to="/login">Go to Login</RouterLink>
    </div>
    
    <div v-else-if="submissions.length === 0" class="empty-state">
      <p>You haven't submitted any events yet.</p>
      <RouterLink to="/events" class="submit-link">Submit your first event</RouterLink>
    </div>
    
    <div v-else class="submissions-list">
      <div 
        v-for="submission in submissions" 
        :key="submission.id" 
        class="submission-item"
        :class="submission.status"
      >
        <div class="submission-header">
          <h3>{{ submission.title }}</h3>
          <span class="status-badge" :class="submission.status">
            {{ submission.status.toUpperCase() }}
          </span>
        </div>
        
        <div class="submission-details">
          <p><strong>Year:</strong> {{ submission.year }}</p>
          <p v-if="submission.date"><strong>Date:</strong> {{ submission.date }}</p>
          <p><strong>Description:</strong> {{ submission.description }}</p>
          <p><strong>Source:</strong> {{ submission.source }}</p>
          <p><strong>Submitted:</strong> {{ formatDate(submission.submittedAt) }}</p>
          
          <div v-if="submission.status === 'rejected'" class="rejection-reason">
            <p><strong>Rejection Reason:</strong></p>
            <p class="reason-text">{{ submission.rejectionReason || 'No reason provided' }}</p>
            <p><strong>Reviewed by:</strong> {{ submission.reviewedByEmail || 'Unknown' }}</p>
            <p><strong>Reviewed on:</strong> {{ formatDate(submission.reviewedAt) }}</p>
          </div>
          
          <div v-if="submission.status === 'approved'" class="approval-info">
            <p><strong>Approved by:</strong> {{ submission.reviewedByEmail || 'Unknown' }}</p>
            <p><strong>Approved on:</strong> {{ formatDate(submission.reviewedAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'

const submissions = ref([])
const loading = ref(true)
const currentUser = ref(null)

onMounted(async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      await loadSubmissions()
    } else {
      currentUser.value = null
      loading.value = false
    }
  })
})

async function loadSubmissions() {
  if (!currentUser.value) {
    loading.value = false
    return
  }
  
  try {
    const submissionsRef = collection(db, 'eventSubmissions')
    const q = query(
      submissionsRef, 
      where('submittedBy', '==', currentUser.value.uid)
    )
    
    const snapshot = await getDocs(q)
    submissions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Sort by submission date (newest first)
    submissions.value.sort((a, b) => {
      const aTime = a.submittedAt?.seconds || 0
      const bTime = b.submittedAt?.seconds || 0
      return bTime - aTime
    })
    
  } catch (error) {
    console.error('Error loading submissions:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  
  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp)
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.submissions-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px;
}

.loading, .empty-state, .error-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.submit-link {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.submit-link:hover {
  text-decoration: underline;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.submission-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}

.submission-item.approved {
  border-left: 4px solid #28a745;
}

.submission-item.rejected {
  border-left: 4px solid #dc3545;
}

.submission-item.pending {
  border-left: 4px solid #ffc107;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.submission-header h3 {
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.submission-details p {
  margin: 8px 0;
}

.rejection-reason {
  margin-top: 15px;
  padding: 15px;
  background: #f8d7da;
  border-radius: 4px;
}

.reason-text {
  font-style: italic;
  color: #721c24;
}

.approval-info {
  margin-top: 15px;
  padding: 15px;
  background: #d4edda;
  border-radius: 4px;
  color: #155724;
}
</style>