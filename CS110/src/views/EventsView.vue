<template>
  <div class="events-view">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        :class="{ active: activeTab === 'timeline' }"
        @click="activeTab = 'timeline'"
        class="tab-btn"
      >
        📚 Timeline
      </button>
      <button 
        v-if="currentUser"
        :class="{ active: activeTab === 'submit' }"
        @click="activeTab = 'submit'"
        class="tab-btn"
      >
        ➕ Submit Event
      </button>
    </div>

    <!-- Main Content with Sidebar -->
    <div class="main-content">
      <!-- Time Period Sidebar (only show on timeline tab) -->
      <div v-if="activeTab === 'timeline'" class="time-sidebar">
        <h3>Browse by Time Period</h3>
        
        <!-- Show All Events -->
        <div class="period-item">
          <button 
            @click="selectTimePeriod('all')"
            :class="{ active: selectedPeriod === 'all' }"
            class="period-btn all-events-btn"
          >
            📋 All Events ({{ totalEventsCount }})
          </button>
        </div>
        
        <!-- Century Groups -->
        <div v-for="century in availableCenturies" :key="century.range" class="century-group">
          <button 
            @click="toggleCentury(century.range)"
            :class="{ active: selectedPeriod === century.range, expanded: expandedCenturies.includes(century.range) }"
            class="period-btn century-btn"
          >
            {{ century.range }} ({{ century.count }})
            <span class="expand-icon">{{ expandedCenturies.includes(century.range) ? '▼' : '▶' }}</span>
          </button>
          
          <!-- Decade Submenu -->
          <div v-if="expandedCenturies.includes(century.range)" class="decade-submenu">
            <button
              v-for="decade in century.decades"
              :key="decade.range"
              @click="selectTimePeriod(decade.range)"
              :class="{ active: selectedPeriod === decade.range }"
              class="period-btn decade-btn"
            >
              {{ decade.range }} ({{ decade.count }})
            </button>
          </div>
        </div>
        
        <!-- No Events Message -->
        <div v-if="availableCenturies.length === 0" class="no-periods">
          <p>No events available yet</p>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area" :class="{ 'with-sidebar': activeTab === 'timeline' }">
        <!-- Timeline Tab -->
        <div v-if="activeTab === 'timeline'" class="timeline-tab">
          <EventTimeLine 
            :filtered-events="filteredEvents" 
            :selected-period="selectedPeriod"
            @switchToSubmit="handleSwitchToSubmit" 
          />
        </div>

        <!-- Submit Event Tab -->
        <div v-else-if="activeTab === 'submit'" class="submit-tab">
          <div class="submit-container">
            <h2>Submit Historical Event</h2>
            <p class="submit-description">
              Share a historical event that you think should be included in our timeline. 
              All submissions are reviewed by our team before being published.
            </p>
            <EventSubmissionForm @eventSubmitted="handleEventSubmitted" />
          </div>
        </div>
      </div>
    </div>

    <!-- Login prompt for non-authenticated users on submit tab -->
    <div v-if="!currentUser && activeTab === 'submit'" class="login-required">
      <div class="login-box">
        <h3>Login Required</h3>
        <p>Please log in to submit historical events.</p>
        <RouterLink to="/login" class="login-btn">Go to Login</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebaseResources'
import EventTimeLine from '../components/EventTimeLine.vue'
import EventSubmissionForm from '../components/EventSubmissionForm.vue'

const activeTab = ref('timeline')
const currentUser = ref(null)
const events = ref([])
const selectedPeriod = ref('all')
const expandedCenturies = ref([])

// Computed properties for time period organization
const availableCenturies = computed(() => {
  if (events.value.length === 0) return []
  
  const centuryMap = new Map()
  
  events.value.forEach(event => {
    const year = parseInt(event.year)
    const century = Math.floor(year / 100) * 100
    const centuryEnd = century + 99
    const centuryRange = `${century}-${centuryEnd}`
    
    if (!centuryMap.has(centuryRange)) {
      centuryMap.set(centuryRange, {
        range: centuryRange,
        start: century,
        end: centuryEnd,
        events: [],
        decades: new Map()
      })
    }
    
    const centuryData = centuryMap.get(centuryRange)
    centuryData.events.push(event)
    
    // Group by decades within century
    const decade = Math.floor(year / 10) * 10
    const decadeEnd = decade + 9
    const decadeRange = `${decade}-${decadeEnd}`
    
    if (!centuryData.decades.has(decadeRange)) {
      centuryData.decades.set(decadeRange, {
        range: decadeRange,
        start: decade,
        end: decadeEnd,
        events: []
      })
    }
    
    centuryData.decades.get(decadeRange).events.push(event)
  })
  
  // Convert to array and sort
  return Array.from(centuryMap.values())
    .map(century => ({
      ...century,
      count: century.events.length,
      decades: Array.from(century.decades.values())
        .map(decade => ({
          ...decade,
          count: decade.events.length
        }))
        .sort((a, b) => b.start - a.start) // Newest decades first
    }))
    .sort((a, b) => b.start - a.start) // Newest centuries first
})

const totalEventsCount = computed(() => events.value.length)

const filteredEvents = computed(() => {
  if (selectedPeriod.value === 'all') {
    return events.value
  }
  
  const [start, end] = selectedPeriod.value.split('-').map(Number)
  return events.value.filter(event => {
    const year = parseInt(event.year)
    return year >= start && year <= end
  })
})

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    if (!user && activeTab.value === 'submit') {
      activeTab.value = 'timeline'
    }
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
  }
}

function selectTimePeriod(period) {
  selectedPeriod.value = period
}

function toggleCentury(centuryRange) {
  const index = expandedCenturies.value.indexOf(centuryRange)
  if (index > -1) {
    expandedCenturies.value.splice(index, 1)
  } else {
    expandedCenturies.value.push(centuryRange)
  }
  
  // If clicking on already selected century, just toggle expansion
  if (selectedPeriod.value !== centuryRange) {
    selectedPeriod.value = centuryRange
  }
}

function handleSwitchToSubmit() {
  if (currentUser.value) {
    activeTab.value = 'submit'
  } else {
    alert('Please log in to submit events')
  }
}

function handleEventSubmitted() {
  // Reload events and switch back to timeline
  loadEvents()
  activeTab.value = 'timeline'
}
</script>

<style scoped>
.events-view {
  min-height: 100vh;
  background: #fff;
}

.tab-navigation {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 2px solid #e9ecef;
  padding: 0 20px;
  z-index: 999;
  display: flex;
  justify-content: center;
}

.tab-btn {
  background: none;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  color: #666;
}

.tab-btn:hover {
  color: #007bff;
  background: rgba(0, 123, 255, 0.05);
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.main-content {
  display: flex;
  padding-top: 120px;
}

.time-sidebar {
  width: 280px;
  min-height: calc(100vh - 120px);
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 20px;
  position: fixed;
  left: 0;
  top: 120px;
  overflow-y: auto;
}

.time-sidebar h3 {
  color: #333;
  margin: 0 0 20px 0;
  font-size: 1.1em;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.period-item {
  margin-bottom: 5px;
}

.period-btn {
  width: 100%;
  background: #fff;
  border: 1px solid #dee2e6;
  padding: 12px 15px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #495057;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.period-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.period-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.all-events-btn {
  font-weight: bold;
  margin-bottom: 15px;
  background: #e3f2fd;
  border-color: #2196f3;
}

.all-events-btn.active {
  background: #2196f3;
}

.century-group {
  margin-bottom: 10px;
}

.century-btn {
  font-weight: bold;
  background: #fff3cd;
  border-color: #ffc107;
}

.century-btn.active {
  background: #ffc107;
  color: #212529;
}

.century-btn.expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.decade-submenu {
  border: 1px solid #dee2e6;
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  background: #fff;
}

.decade-btn {
  border: none;
  border-radius: 0;
  border-bottom: 1px solid #f1f3f4;
  margin: 0;
  padding-left: 25px;
  font-size: 13px;
}

.decade-btn:last-child {
  border-bottom: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.decade-btn.active {
  background: #28a745;
  color: white;
}

.content-area {
  flex: 1;
  min-height: calc(100vh - 120px);
}

.content-area.with-sidebar {
  margin-left: 280px;
}

.timeline-tab {
  /* EventTimeLine will handle its own styling */
}

.submit-tab {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.submit-container h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.submit-description {
  text-align: center;
  color: #666;
  margin-bottom: 40px;
  font-size: 1.1em;
  line-height: 1.5;
}

.no-periods {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.login-required {
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

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
}

.login-box h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.login-box p {
  color: #666;
  margin-bottom: 25px;
}

.login-btn {
  display: inline-block;
  background: #007bff;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background 0.2s ease;
}

.login-btn:hover {
  background: #0056b3;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .time-sidebar {
    position: relative;
    width: 100%;
    top: 0;
    padding: 15px;
    min-height: auto;
  }
  
  .content-area.with-sidebar {
    margin-left: 0;
  }
  
  .tab-navigation {
    padding: 0 10px;
  }
  
  .tab-btn {
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .submit-tab {
    padding: 10px;
  }
}
</style>