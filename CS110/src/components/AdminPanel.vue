<template>
  <div class="admin-panel">
    <h2>Admin Panel - Event Review</h2>
    
    <div v-if="loading" class="loading">Loading pending submissions...</div>
    
    <div v-else-if="!isAdmin" class="access-denied">
      <p>Access Denied: Admin privileges required</p>
    </div>
    
    <div v-else-if="pendingSubmissions.length === 0" class="empty-state">
      <p>No pending submissions to review</p>
    </div>
    
    <div v-else class="submissions-grid">
      <div 
        v-for="submission in pendingSubmissions" 
        :key="submission.id"
        class="submission-card"
      >
        <div class="submission-header">
          <h3>{{ submission.title }}</h3>
          <span class="submission-date">{{ submission.year }}</span>
        </div>
        
        <div class="submission-content">
          <p v-if="submission.date"><strong>Date:</strong> {{ submission.date }}</p>
          <p><strong>Description:</strong> {{ submission.description }}</p>
          <p><strong>Source:</strong> {{ submission.source }}</p>
          <p><strong>Submitted by:</strong> {{ submission.submittedByEmail }}</p>
          <p><strong>Submitted on:</strong> {{ formatDate(submission.submittedAt) }}</p>
        </div>
        
        <div class="admin-actions">
          <button 
            @click="approveSubmission(submission)"
            :disabled="processingId === submission.id"
            class="approve-btn"
          >
            {{ processingId === submission.id ? 'Processing...' : 'Approve' }}
          </button>
          
          <button 
            @click="openRejectModal(submission)"
            :disabled="processingId === submission.id"
            class="reject-btn"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
    
    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal" @click.stop>
        <h3>Reject Submission</h3>
        <p><strong>Event:</strong> {{ selectedSubmission?.title }}</p>
        
        <div class="form-group">
          <label for="rejectionReason">Reason for rejection:</label>
          <textarea 
            id="rejectionReason"
            v-model="rejectionReason"
            rows="4"
            placeholder="Please provide a clear reason for rejection..."
            required
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button @click="rejectSubmission" :disabled="!rejectionReason.trim()" class="confirm-reject-btn">
            Confirm Rejection
          </button>
          <button @click="closeRejectModal" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'

const pendingSubmissions = ref([])
const loading = ref(true)
const currentUser = ref(null)
const userDoc = ref(null)
const processingId = ref(null)
const showRejectModal = ref(false)
const selectedSubmission = ref(null)
const rejectionReason = ref('')

const isAdmin = computed(() => {
  return userDoc.value?.isAdmin === true
})

onMounted(async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      await loadUserData()
      if (isAdmin.value) {
        await loadPendingSubmissions()
      }
    } else {
      currentUser.value = null
      loading.value = false
    }
  })
})

async function loadUserData() {
  if (!currentUser.value) return
  
  try {
    const userDocRef = doc(db, 'users', currentUser.value.uid)
    const userSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.value.uid)))
    
    if (!userSnapshot.empty) {
      userDoc.value = userSnapshot.docs[0].data()
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

async function loadPendingSubmissions() {
  try {
    const submissionsRef = collection(db, 'eventSubmissions')
    const q = query(submissionsRef, where('status', '==', 'pending'))
    
    const snapshot = await getDocs(q)
    pendingSubmissions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Sort by submission date (oldest first for review)
    pendingSubmissions.value.sort((a, b) => {
      const aTime = a.submittedAt?.seconds || 0
      const bTime = b.submittedAt?.seconds || 0
      return aTime - bTime
    })
    
  } catch (error) {
    console.error('Error loading pending submissions:', error)
  } finally {
    loading.value = false
  }
}

async function approveSubmission(submission) {
  processingId.value = submission.id
  
  try {
    // 1. Add to approved events collection
    const eventData = {
      title: submission.title,
      year: submission.year,
      date: submission.date,
      description: submission.description,
      source: submission.source,
      submittedBy: submission.submittedBy,
      submittedByEmail: submission.submittedByEmail,
      submittedAt: submission.submittedAt,
      approvedBy: currentUser.value.uid,
      approvedByEmail: currentUser.value.email,
      approvedAt: new Date(),
      originalSubmissionId: submission.id
    }
    
    await addDoc(collection(db, 'events'), eventData)
    
    // 2. Update submission status
    const submissionRef = doc(db, 'eventSubmissions', submission.id)
    await updateDoc(submissionRef, {
      status: 'approved',
      reviewedBy: currentUser.value.uid,
      reviewedByEmail: currentUser.value.email,
      reviewedAt: new Date()
    })
    
    // 3. Remove from pending list
    pendingSubmissions.value = pendingSubmissions.value.filter(s => s.id !== submission.id)
    
    alert('Event approved successfully!')
    
  } catch (error) {
    console.error('Error approving submission:', error)
    alert('Failed to approve event. Please try again.')
  } finally {
    processingId.value = null
  }
}

function openRejectModal(submission) {
  selectedSubmission.value = submission
  rejectionReason.value = ''
  showRejectModal.value = true
}

function closeRejectModal() {
  showRejectModal.value = false
  selectedSubmission.value = null
  rejectionReason.value = ''
}

async function rejectSubmission() {
  if (!selectedSubmission.value || !rejectionReason.value.trim()) return
  
  processingId.value = selectedSubmission.value.id
  
  try {
    const submissionRef = doc(db, 'eventSubmissions', selectedSubmission.value.id)
    await updateDoc(submissionRef, {
      status: 'rejected',
      reviewedBy: currentUser.value.uid,
      reviewedByEmail: currentUser.value.email,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason.value.trim()
    })
    
    // Remove from pending list
    pendingSubmissions.value = pendingSubmissions.value.filter(s => s.id !== selectedSubmission.value.id)
    
    closeRejectModal()
    alert('Event rejected successfully!')
    
  } catch (error) {
    console.error('Error rejecting submission:', error)
    alert('Failed to reject event. Please try again.')
  } finally {
    processingId.value = null
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
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px;
  color: black;
}

.loading, .access-denied, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.access-denied {
  color: #dc3545;
  font-weight: bold;
}

.submissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.submission-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.submission-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.submission-date {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.submission-content p {
  margin: 8px 0;
  font-size: 14px;
  color: black;
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.approve-btn, .reject-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #218838;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #c82333;
}

.approve-btn:disabled, .reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #dc3545;
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.confirm-reject-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.confirm-reject-btn {
  background: #dc3545;
  color: white;
}

.confirm-reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}
</style>