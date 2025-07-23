<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <h2 v-if="selectedPeriod === 'all'">All Historical Events ({{ filteredEvents.length }})</h2>
      <h2 v-else>Events from {{ selectedPeriod }} ({{ filteredEvents.length }})</h2>
      <p v-if="selectedPeriod !== 'all'" class="period-description">
        Showing events from {{ selectedPeriod }}
      </p>
    </div>
    
    <div v-if="loading" class="loading">Loading events...</div>
    
    <div v-else class="timeline">
      <div v-for="event in sortedEvents" :key="event.id" class="event-item">
        <div class="event-year">{{ event.year }}</div>
        <div class="event-content">
          <h3>
            <RouterLink :to="`/events/${event.id}`" class="event-title-link">
              {{ event.title }}
            </RouterLink>
          </h3>
          <p class="event-date" v-if="event.date">{{ event.date }}</p>
          <p class="event-description">{{ event.description }}</p>
          <small>Source: {{ event.source }}</small>
          
          <!-- Quick Actions -->
          <div class="event-actions">
            <RouterLink :to="`/events/${event.id}`" class="discuss-link">
              💬 Join Discussion
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="!loading && filteredEvents.length === 0" class="empty-state">
      <h3 v-if="selectedPeriod === 'all'">No Historical Events Yet</h3>
      <h3 v-else>No Events in {{ selectedPeriod }}</h3>
      <p v-if="selectedPeriod === 'all'">Be the first to submit a historical event!</p>
      <p v-else>No events found for this time period. Try selecting a different period or submit a new event.</p>
      <button @click="$emit('switchToSubmit')" class="submit-first-btn">
        Submit Event
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps, watch } from 'vue'

const emit = defineEmits(['switchToSubmit'])
const props = defineProps({
  filteredEvents: {
    type: Array,
    default: () => []
  },
  selectedPeriod: {
    type: String,
    default: 'all'
  }
})

const loading = ref(false)

const sortedEvents = computed(() => {
  return props.filteredEvents.sort((a, b) => b.year - a.year)
})

// Watch for changes in filtered events to show loading state
watch(() => props.filteredEvents, () => {
  loading.value = false
}, { immediate: true })
</script>

<style scoped>
.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.timeline-header {
  margin-bottom: 30px;
  text-align: center;
}

.timeline-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.period-description {
  color: #666;
  font-style: italic;
}

.event-item {
  display: flex;
  margin-bottom: 30px;
  padding: 20px;
  border-left: 4px solid #007bff;
  background: #f8f9fa;
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.event-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
}

.event-title-link {
  color: #333;
  text-decoration: none;
  transition: color 0.2s ease;
}

.event-title-link:hover {
  color: #007bff;
  text-decoration: underline;
}

.event-date {
  font-style: italic;
  color: #666;
  margin: 0 0 10px 0;
}

.event-description {
  margin: 0 0 15px 0;
  line-height: 1.5;
  color: #555;
}

.event-actions {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #dee2e6;
}

.discuss-link {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9em;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.discuss-link:hover {
  background-color: rgba(0, 123, 255, 0.1);
  text-decoration: none;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 15px;
}

.empty-state p {
  font-size: 1.1em;
  margin-bottom: 30px;
}

.submit-first-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
}

.submit-first-btn:hover {
  background: #218838;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .event-item {
    flex-direction: column;
  }
  
  .event-year {
    margin-right: 0;
    margin-bottom: 10px;
    text-align: center;
  }
}
</style>