<template>
  <div class="event-detail-view">
    <div v-if="loading" class="loading">Loading event...</div>
    
    <div v-else-if="!event" class="error-state">
      <h2>Event Not Found</h2>
      <p>The event you're looking for doesn't exist.</p>
      <RouterLink to="/events" class="back-link">← Back to Timeline</RouterLink>
    </div>
    
    <div v-else class="event-detail">
      <!-- Event Header -->
      <div class="event-header">
        <RouterLink to="/events" class="back-link">← Back to Timeline</RouterLink>
        <div class="event-year-badge">{{ event.year }}</div>
      </div>
      
      <!-- Event Content -->
      <div class="event-content">
        <h1>{{ event.title }}</h1>
        <p v-if="event.date" class="event-date">{{ event.date }}</p>
        <div class="event-description">
          <p>{{ event.description }}</p>
        </div>
        <div class="event-meta">
          <p><strong>Source:</strong> {{ event.source }}</p>
          <p v-if="event.approvedByEmail"><strong>Approved by:</strong> {{ event.approvedByEmail }}</p>
          <p v-if="event.approvedAt"><strong>Approved on:</strong> {{ formatDate(event.approvedAt) }}</p>
        </div>
      </div>
      
      <!-- Comments Section -->
      <div class="comments-section">
        <EventComments :eventId="event.id" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseResources'
import EventComments from '../components/EventComments.vue'

const route = useRoute()
const event = ref(null)
const loading = ref(true)

onMounted(async () => {
  await loadEvent()
})

async function loadEvent() {
  try {
    const eventDoc = await getDoc(doc(db, 'events', route.params.eventId))
    
    if (eventDoc.exists()) {
      event.value = {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    }
  } catch (error) {
    console.error('Error loading event:', error)
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
    day: 'numeric'
  })
}
</script>

<style scoped>
.event-detail-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px;
}

.loading, .error-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-state h2 {
  color: #dc3545;
}

.back-link {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
  margin-bottom: 20px;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.event-year-badge {
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.2em;
}

.event-content {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 40px;
  border-left: 4px solid #007bff;
}

.event-content h1 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 2em;
}

.event-date {
  font-style: italic;
  color: #666;
  font-size: 1.1em;
  margin-bottom: 20px;
}

.event-description {
  margin: 20px 0;
}

.event-description p {
  line-height: 1.6;
  font-size: 1.1em;
  color: #444;
}

.event-meta {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.event-meta p {
  margin: 5px 0;
  font-size: 0.9em;
  color: #666;
}

.comments-section {
  margin-top: 40px;
}
</style>