<template>
  <div class="submission-form-container">
    <h3>Submit Historical Event</h3>
    
    <form @submit.prevent="submitEvent" class="event-form">
      <div class="form-group">
        <label for="title">Event Title *</label>
        <input 
          id="title"
          v-model="form.title" 
          type="text" 
          required 
          placeholder="e.g., Declaration of Independence"
        />
      </div>
      
      <div class="form-group">
        <label for="year">Year *</label>
        <input 
          id="year"
          v-model.number="form.year" 
          type="number" 
          required 
          min="1"
          max="2024"
          placeholder="e.g., 1776"
        />
      </div>
      
      <div class="form-group">
        <label for="date">Full Date (optional)</label>
        <input 
          id="date"
          v-model="form.date" 
          type="text" 
          placeholder="e.g., July 4, 1776"
        />
      </div>
      
      <div class="form-group">
        <label for="description">Description *</label>
        <textarea 
          id="description"
          v-model="form.description" 
          required 
          rows="4"
          placeholder="Describe the historical event..."
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="source">Source *</label>
        <input 
          id="source"
          v-model="form.source" 
          type="text" 
          required 
          placeholder="e.g., Wikipedia, History.com, Encyclopedia Britannica"
        />
      </div>
      
      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting" class="submit-btn">
          {{ isSubmitting ? 'Submitting...' : 'Submit Event' }}
        </button>
        <button type="button" @click="resetForm" class="reset-btn">
          Clear Form
        </button>
      </div>
    </form>
    
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseResources'

const form = reactive({
  title: '',
  year: null,
  date: '',
  description: '',
  source: ''
})

const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

async function submitEvent() {
  if (!auth.currentUser) {
    errorMessage.value = 'You must be logged in to submit events'
    return
  }
  
  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    const submissionData = {
      title: form.title.trim(),
      year: form.year,
      date: form.date.trim() || null,
      description: form.description.trim(),
      source: form.source.trim(),
      submittedBy: auth.currentUser.uid,
      submittedByEmail: auth.currentUser.email,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null
    }
    
    await addDoc(collection(db, 'eventSubmissions'), submissionData)
    
    successMessage.value = 'Event submitted successfully! It will be reviewed by our team.'
    resetForm()
    
  } catch (error) {
    console.error('Error submitting event:', error)
    errorMessage.value = 'Failed to submit event. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  form.title = ''
  form.year = null
  form.date = ''
  form.description = ''
  form.source = ''
}
</script>

<style scoped>
.submission-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 30px;
  color: black;
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.form-actions {
  display: flex;
  gap: 10px;
}

.submit-btn, .reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.submit-btn {
  background: #007bff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #545b62;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-top: 20px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 20px;
}
</style>