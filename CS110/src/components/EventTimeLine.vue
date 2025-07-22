<template>
  <div class="timeline-container">
    <h2>Historical Events Timeline</h2>
    
    <!-- Add submission form for logged-in users -->
    <div v-if="currentUser" class="submission-section">
      <EventSubmissionForm />
    </div>
    
    <div v-if="loading" class="loading">Loading events...</div>
    
    <div v-else class="timeline">
      <div v-for="event in sortedEvents" :key="event.id" class="event-item">
        <div class="event-year">{{ event.year }}</div>
        <div class="event-content">
          <h3>{{ event.title }}</h3>
          <p class="event-date" v-if="event.date">{{ event.date }}</p>
          <p>{{ event.description }}</p>
          <small>Source: {{ event.source }}</small>
        </div>
      </div>
    </div>
    
    <div v-if="!loading && events.length === 0" class="empty-state">
      No historical events yet. Be the first to submit one!
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'
import EventSubmissionForm from './EventSubmissionForm.vue'

const events = ref([])
const loading = ref(true)
const currentUser = ref(null)

const sortedEvents = computed(() => {
  return events.value.sort((a, b) => b.year - a.year)
})

onMounted(async () => {
  // Check auth state
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
  
  await loadEvents()
})

async function loadEvents() {
  try {
    const eventsRef = collection(db, 'events')
    const q = query(eventsRef, orderBy('year', 'desc'))
    const snapshot = await getDocs(q)
    
    events.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading events:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px; /* Account for fixed header */
}

.submission-section {
  margin-bottom: 40px;
}

.event-item {
  display: flex;
  margin-bottom: 30px;
  padding: 20px;
  border-left: 4px solid #007bff;
  background: #f8f9fa;
  border-radius: 8px;
}

.event-year {
  font-size: 1.5em;
  font-weight: bold;
  color: #007bff;
  min-width: 80px;
  margin-right: 20px;
}

.event-content h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.event-date {
  font-style: italic;
  color: #666;
  margin: 0 0 10px 0;
}

.event-content p {
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>