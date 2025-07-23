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

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Timeline Tab -->
      <div v-if="activeTab === 'timeline'" class="timeline-tab">
        <EventTimeLine />
      </div>

      <!-- Submit Event Tab -->
      <div v-else-if="activeTab === 'submit'" class="submit-tab">
        <div class="submit-container">
          <h2>Submit Historical Event</h2>
          <p class="submit-description">
            Share a historical event that you think should be included in our timeline. 
            All submissions are reviewed by our team before being published.
          </p>
          <EventSubmissionForm />
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
import { ref, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseResources'
import EventTimeLine from '../components/EventTimeLine.vue'
import EventSubmissionForm from '../components/EventSubmissionForm.vue'

const activeTab = ref('timeline')
const currentUser = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    // If user logs out while on submit tab, switch to timeline
    if (!user && activeTab.value === 'submit') {
      activeTab.value = 'timeline'
    }
  })
})

// Handle switch to submit tab from timeline
function handleSwitchToSubmit() {
  if (currentUser.value) {
    activeTab.value = 'submit'
  } else {
    // Could redirect to login or show login modal
    alert('Please log in to submit events')
  }
}
</script>

<style scoped>
.events-view {
  min-height: 100vh;
  background: #fff;
}

.tab-navigation {
  position: fixed;
  top: 60px; /* Adjust based on your navbar height */
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

.tab-content {
  padding-top: 120px; /* Space for fixed tabs + navbar */
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
  
  .tab-content {
    padding-top: 110px;
  }
}
</style>