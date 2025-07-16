<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebaseResources'
import { doc, getDoc } from 'firebase/firestore'
import PostFeed from '@/components/PostFeed.vue'

const route = useRoute()
const profileUser = ref(null)
const profileUserPosts = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadUserProfile()
})

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
</script>

<template>
  <main>
    <div class="profile-container">
      <div v-if="loading" class="loading">
        Loading user profile...
      </div>
      
      <div v-else-if="profileUser" class="profile-content">
        <div class="profile-header">
          <h1>{{ profileUser.email }}</h1>
          <div class="profile-stats">
            <div class="stat">
              <strong>{{ (profileUser.posts || []).length }}</strong>
              <span>Posts</span>
            </div>
            <div class="stat">
              <strong>{{ (profileUser.following || []).length }}</strong>
              <span>Following</span>
            </div>
            <div class="stat">
              <strong>{{ (profileUser.followers || []).length }}</strong>
              <span>Followers</span>
            </div>
          </div>
        </div>
        
        <div class="profile-posts">
          <h2>Posts by {{ profileUser.email }}</h2>
          <PostFeed :posts="profileUserPosts" />
          
          <div v-if="profileUserPosts.length === 0" class="no-posts">
            <p>This user has no posts yet.</p>
          </div>
        </div>
      </div>
      
      <div v-else class="error">
        <p>User not found</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  margin-top: 70px;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.2rem;
}

.profile-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-header h1 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  min-width: 80px;
}

.stat strong {
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat span {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-posts {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-posts h2 {
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.no-posts {
  text-align: center;
  color: #666;
  padding: 3rem 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
}

.no-posts p {
  margin: 0;
  font-size: 1.1rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .profile-stats {
    gap: 1.5rem;
  }
  
  .stat {
    min-width: 60px;
    padding: 0.75rem;
  }
  
  .stat strong {
    font-size: 1.5rem;
  }
  
  .profile-header h1 {
    font-size: 1.5rem;
  }
}
</style>