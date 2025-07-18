<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, db } from '../firebaseResources'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import PostFeed from '@/components/PostFeed.vue'
import CreatePost from '@/components/CreatePost.vue'

const route = useRoute()
const router = useRouter()
const profileUser = ref(null)
const profileUserPosts = ref([])
const currentUser = ref(null)
const currentUserDoc = ref(null)
const loading = ref(true)
const canFollow = ref(false)
const isFollowing = ref(false)

onMounted(async () => {
  // Check authentication state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = {
        email: user.email,
        username: user.email.split('@')[0],
        uid: user.uid
      }
      await loadCurrentUserDoc()
    } else {
      currentUser.value = null
      currentUserDoc.value = null
    }
    await loadUserProfile()
  })
})

async function loadCurrentUserDoc() {
  if (!currentUser.value) return
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', currentUser.value.email))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      currentUserDoc.value = {
        id: userDoc.id,
        ...userDoc.data()
      }
    }
  } catch (error) {
    console.error('Error loading current user document:', error)
  }
}

async function loadUserProfile() {
  try {
    const userId = route.params.userId
    console.log('Loading profile for user ID:', userId)
    
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (userDoc.exists()) {
      profileUser.value = {
        id: userDoc.id,
        ...userDoc.data()
      }
      
      // Check if current user can follow this user and if already following
      if (currentUserDoc.value && currentUserDoc.value.id !== profileUser.value.id) {
        canFollow.value = true
        const followingIds = currentUserDoc.value.following || []
        isFollowing.value = followingIds.includes(profileUser.value.id)
      }
      
      // Load user's posts
      const userPostIds = profileUser.value.posts || []
      const userPostDocs = []
      
      for (const postId of userPostIds) {
        const postDoc = await getDoc(doc(db, 'posts', postId))
        if (postDoc.exists()) {
          userPostDocs.push({ id: postDoc.id, ...postDoc.data() })
        }
      }
      
      profileUserPosts.value = userPostDocs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
      console.log('Profile loaded:', profileUser.value)
    } else {
      console.error('User not found')
    }
  } catch (error) {
    console.error('Error loading user profile:', error)
  } finally {
    loading.value = false
  }
}

async function handleFollow() {
  if (!currentUser.value || !currentUserDoc.value || !profileUser.value) return
  
  try {
    console.log('Following user:', profileUser.value.id)
    
    // Update current user's following array
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      following: arrayUnion(profileUser.value.id)
    })
    
    // Update target user's followers array
    await updateDoc(doc(db, 'users', profileUser.value.id), {
      followers: arrayUnion(currentUserDoc.value.id)
    })
    
    // Add target user's posts to current user's feed
    const targetUserPosts = profileUser.value.posts || []
    if (targetUserPosts.length > 0) {
      await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
        feed: arrayUnion(...targetUserPosts)
      })
    }
    
    // Update local state
    isFollowing.value = true
    
    // Reload data
    await loadCurrentUserDoc()
    
  } catch (error) {
    console.error('Error following user:', error)
  }
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <main>
    <div v-if="loading" class="loading">
      Loading user profile...
    </div>
    
    <div v-else-if="profileUser" class="main-columns">
      <!-- Left Column - Profile User Stats -->
      <div class="left-column">
        <div class="user-profile">
          <div class="profile-info">
            <div class="username"><strong>{{ profileUser.email }}</strong></div>
            <div class="stat-item">Posts: {{ (profileUser.posts || []).length }}</div>
            <div class="stat-item">Following: {{ (profileUser.following || []).length }}</div>
            <div class="stat-item">Followers: {{ (profileUser.followers || []).length }}</div>
          </div>
          
          <!-- Follow/Back Actions -->
          <div class="action-section">
            <button v-if="canFollow && !isFollowing" @click="handleFollow" class="follow-btn">
              Follow {{ profileUser.email.split('@')[0] }}
            </button>
            <div v-else-if="isFollowing" class="following-indicator">
              ✓ Following
            </div>
            <button @click="goBack" class="back-btn">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div class="center-column">
        <div class="post-header">
          <h2>{{ profileUser.email }}'s Posts</h2>
          <p class="profile-subtitle">{{ profileUserPosts.length }} post{{ profileUserPosts.length !== 1 ? 's' : '' }}</p>
        </div>
        
        <PostFeed :posts="profileUserPosts" />
        
        <div v-if="profileUserPosts.length === 0" class="no-posts">
          <p>{{ profileUser.email }} hasn't posted anything yet.</p>
        </div>
      </div>

      <div class="right-column">
        <h3>{{ profileUser.email }}</h3>
      </div>
    </div>

    <div v-else class="error">
      <p>User not found</p>
      <button @click="goBack" class="back-btn">
        ← Back to Home
      </button>
    </div>
  </main>
</template>

<style scoped>
.loading, .error {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.2rem;
  margin-top: 70px;
}

.main-columns {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  margin-top: 70px; /* Account for fixed navbar */
}

.left-column {
  flex: 0 0 250px;
  background: #f1eed8d6;
  color: rgb(3, 0, 0);
  padding: 1rem;
  border-radius: 8px;
  height: fit-content;
}

.center-column {
  flex: 1;
  min-width: 0;
}

.right-column {
  flex: 0 0 250px;
  background: #f1eed8d6;
  color: #333;
  padding: 1rem;
  border-radius: 8px;
  height: fit-content;
}

.user-profile {
  text-align: center;
}

.profile-info {
  margin-bottom: 1rem;
}

.username {
  font-size: 1.1em;
  margin-bottom: 0.5rem;
  color: #333;
}

.stat-item {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.9em;
}

.action-section {
  margin-top: 1rem;
}

.follow-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  font-size: 14px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
}

.follow-btn:hover {
  background-color: #369870;
}

.following-indicator {
  background-color: #28a745;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  width: 100%;
  font-size: 14px;
  margin-bottom: 0.5rem;
  text-align: center;
  font-weight: 500;
}

.back-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #5a6268;
}

.post-header {
  text-align: center;
  margin-bottom: 1rem;
}

.post-header h2 {
  color: #333;
  margin: 0 0 0.5rem 0;
}

.profile-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.no-posts {
  text-align: center;
  color: #666;
  margin-top: 2rem;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.current-user-info h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1rem;
  text-align: center;
}

.stats-content {
  text-align: center;
}

.loading-state {
  text-align: center;
  color: #666;
}

.login-prompt {
  text-align: center;
}

.login-prompt p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.login-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .main-columns {
    flex-direction: column;
    gap: 1rem;
  }
  
  .left-column,
  .right-column {
    flex: none;
  }
}
</style>