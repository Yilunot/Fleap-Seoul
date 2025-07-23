<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebaseResources'
import { collection, getDocs, addDoc, query, orderBy, where, serverTimestamp, doc, updateDoc, arrayUnion, getDoc, limit, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import PostFeed from '@/components/PostFeed.vue'
import Followers from '@/components/Followers.vue'
import LoginButton from '@/components/LoginButton.vue'
import CreatePost from '@/components/CreatePost.vue'
import UserStats from '@/components/UserStats.vue'
import LogOutButton from '@/components/LogOutButton.vue'


const currentUser = ref(null)
const currentUserDoc = ref(null)
const publicPosts = ref([])
const userPosts = ref([])
const suggestedUsers = ref([])
const showUserPosts = ref(false)
const selectedUser = ref(null)
const selectedUserPosts = ref([])
const viewMode = ref('all')
const followingUsers = ref([])

onMounted(() => {
  console.log('🚀 HomeView mounted')
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('👤 User authenticated:', user.email)
      currentUser.value = {
        email: user.email,
        username: user.email.split('@')[0],
        uid: user.uid
      }
      await loadCurrentUserDoc()
      loadUserPosts()
    } else {
      console.log('❌ No user authenticated')
      currentUser.value = null
      currentUserDoc.value = null
    }
  })
  loadPublicPosts()
  loadSuggestedUsers()
})

async function loadCurrentUserDoc() {
  if (!currentUser.value) return
  
  try {
    console.log('🔍 Loading current user document...')
    
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', currentUser.value.email))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const userDocData = querySnapshot.docs[0]
      currentUserDoc.value = {
        id: userDocData.id,
        ...userDocData.data()
      }
      console.log('✅ Current user document loaded:', currentUserDoc.value)
      
      // Load following users after loading current user doc
      await loadFollowingUsers()
    }
  } catch (error) {
    console.error('Error loading current user document:', error)
  }
}

async function handleUnfollow(userToUnfollow) {
  if (!currentUserDoc.value) return
  
  try {
    console.log('Unfollowing user:', userToUnfollow.email)
    
    // Remove from current user's following list
    const updatedFollowing = (currentUserDoc.value.following || []).filter(id => id !== userToUnfollow.id)
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      following: updatedFollowing
    })
    
    // Remove from target user's followers list
    const targetUserDoc = await getDoc(doc(db, 'users', userToUnfollow.id))
    if (targetUserDoc.exists()) {
      const targetUserData = targetUserDoc.data()
      const updatedFollowers = (targetUserData.followers || []).filter(id => id !== currentUserDoc.value.id)
      await updateDoc(doc(db, 'users', userToUnfollow.id), {
        followers: updatedFollowers
      })
    }
    
    // Reload current user doc and following users
    await loadCurrentUserDoc()
    
    console.log('✅ Successfully unfollowed:', userToUnfollow.email)
    
  } catch (error) {
    console.error('Error unfollowing user:', error)
  }
}

async function loadPublicPosts() {
  try {
    console.log('🔍 Loading public posts...', currentUserDoc.value)
    
    if (currentUserDoc.value && currentUserDoc.value.feed && currentUserDoc.value.feed.length > 0) {
      console.log('📰 Loading from user feed:', currentUserDoc.value.feed)
      const feedPostIds = currentUserDoc.value.feed.slice(-10).reverse()
      const feedPosts = []
      
      for (const postId of feedPostIds) {
        const postDoc = await getDoc(doc(db, 'posts', postId))
        if (postDoc.exists()) {
          feedPosts.push({ id: postDoc.id, ...postDoc.data() })
        }
      }
      publicPosts.value = feedPosts
      console.log('✅ Feed posts loaded:', feedPosts)
    } else {
      console.log('📚 Loading all posts from posts collection')
      const postsRef = collection(db, 'posts')
      const q = query(postsRef, orderBy('timestamp', 'desc'), limit(10))
      const querySnapshot = await getDocs(q)
      publicPosts.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('✅ All posts loaded:', publicPosts.value)
    }
  } catch (error) {
    console.error('❌ Error loading public posts:', error)
  }
}

async function loadUserPosts() {
  if (!currentUserDoc.value) return
  try {
    console.log('🔍 Loading user posts...')
    const userPostIds = currentUserDoc.value.posts || []
    const userPostDocs = []
    
    for (const postId of userPostIds) {
      const postDoc = await getDoc(doc(db, 'posts', postId))
      if (postDoc.exists()) {
        userPostDocs.push({ id: postDoc.id, ...postDoc.data() })
      }
    }
    
    userPosts.value = userPostDocs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
    console.log('✅ User posts loaded:', userPosts.value)
  } catch (error) {
    console.error('Error loading user posts:', error)
  }
}

async function loadSuggestedUsers() {
  try {
    console.log('🔍 Loading suggested users...')
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)
    
    let allUsers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('📋 All users from database:', allUsers)
    
    if (currentUserDoc.value) {
      const followingIds = currentUserDoc.value.following || []
      console.log('👥 Currently following:', followingIds)
      allUsers = allUsers.filter(user => 
        user.email !== currentUser.value?.email && 
        !followingIds.includes(user.id)
      )
    } else {
      allUsers = allUsers.filter(user => user.email !== currentUser.value?.email)
    }
    
    console.log('🔄 Filtered users:', allUsers)
    
    const shuffled = allUsers.sort(() => 0.5 - Math.random())
    suggestedUsers.value = shuffled.slice(0, 5)
    console.log('✅ Suggested users loaded:', suggestedUsers.value)
  } catch (error) {
    console.error('❌ Error loading suggested users:', error)
  }
}

async function handleUserClick(user) {
  try {
    console.log('👤 Loading posts for user:', user.email)
    selectedUser.value = user
    viewMode.value = 'selected'
    
    // Load the selected user's posts
    const userPostIds = user.posts || []
    const userPostDocs = []
    
    for (const postId of userPostIds) {
      const postDoc = await getDoc(doc(db, 'posts', postId))
      if (postDoc.exists()) {
        userPostDocs.push({ id: postDoc.id, ...postDoc.data() })
      }
    }
    
    // Sort by timestamp (most recent first)
    selectedUserPosts.value = userPostDocs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
    console.log('✅ Selected user posts loaded:', selectedUserPosts.value)
  } catch (error) {
    console.error('Error loading selected user posts:', error)
  }
}

async function handlePost(content) {
  if (!currentUser.value || !currentUserDoc.value) return
  
  try {
    console.log('📝 Creating new post...')
    const newPost = {
      timestamp: serverTimestamp(),
      author: currentUser.value.email,
      content: content
    }
    
    const postRef = await addDoc(collection(db, 'posts'), newPost)
    console.log('✅ Post created with ID:', postRef.id)
  
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      posts: arrayUnion(postRef.id)
    })
    
    const followers = currentUserDoc.value.followers || []
    for (const followerId of followers) {
      await updateDoc(doc(db, 'users', followerId), {
        feed: arrayUnion(postRef.id)
      })
    }
    
    await loadCurrentUserDoc()
    await loadUserPosts()
    await loadPublicPosts()
  } catch (error) {
    console.error('Error adding post:', error)
  }
}

async function handleFollow(userId) {
  if (!currentUser.value || !currentUserDoc.value) return
  
  try {
    console.log('👥 Following user:', userId)
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      following: arrayUnion(userId)
    })
    
    await updateDoc(doc(db, 'users', userId), {
      followers: arrayUnion(currentUserDoc.value.id)
    })
    
    const targetUserDoc = await getDoc(doc(db, 'users', userId))
    if (targetUserDoc.exists()) {
      const targetUserPosts = targetUserDoc.data().posts || []
      if (targetUserPosts.length > 0) {
        await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
          feed: arrayUnion(...targetUserPosts)
        })
      }
    }
    
    await loadCurrentUserDoc()
    await loadSuggestedUsers()
    await loadPublicPosts()
  } catch (error) {
    console.error('Error following user:', error)
  }
}

function togglePostView() {
  if (viewMode.value === 'all') {
    viewMode.value = 'user'
    showUserPosts.value = true
  } else if (viewMode.value === 'user') {
    viewMode.value = 'all'
    showUserPosts.value = false
    selectedUser.value = null
  } else {
    // From selected user back to all posts
    viewMode.value = 'all'
    showUserPosts.value = false
    selectedUser.value = null
  }
}
async function loadFollowingUsers() {
  if (!currentUserDoc.value) {
    followingUsers.value = []
    return
  }
  
  try {
    console.log('🔍 Loading following users...')
    
    const followingIds = currentUserDoc.value.following || []
    console.log('📋 Following IDs:', followingIds)
    
    if (followingIds.length === 0) {
      followingUsers.value = []
      return
    }
    
    const followingUsersData = []
    
    for (const userId of followingIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          followingUsersData.push({
            id: userDoc.id,
            ...userDoc.data()
          })
        }
      } catch (error) {
        console.error('Error loading following user:', userId, error)
      }
    }
    
    followingUsers.value = followingUsersData
    console.log('✅ Following users loaded:', followingUsers.value)
    
  } catch (error) {
    console.error('Error loading following users:', error)
    followingUsers.value = []
  }
}

function getCurrentPosts() {
  if (viewMode.value === 'selected') {
    return selectedUserPosts.value
  } else if (viewMode.value === 'user') {
    return userPosts.value
  } else {
    return publicPosts.value
  }
}

function getHeaderText() {
  if (viewMode.value === 'selected') {
    return `${selectedUser.value.email}'s Posts`
  } else if (viewMode.value === 'user') {
    return 'Your Posts'
  } else {
    return currentUser.value ? 'Your Feed' : 'All Posts'
  }
}

function getToggleButtonText() {
  if (viewMode.value === 'selected') {
    return 'Back to All Posts'
  } else if (viewMode.value === 'user') {
    return 'Show All Posts'
  } else {
    return 'Show My Feed'
  }
}

async function handleLogout() {
  try {
    await signOut(auth)
    currentUser.value = null
    currentUserDoc.value = null
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <main>
    <div class="main-columns">
      <div class="left-column">
        <div v-if="currentUserDoc">
          <div><strong>{{ currentUser.username }}</strong></div>
          <div>Posts: {{ (currentUserDoc.posts || []).length }}</div>
          <div>Following: {{ (currentUserDoc.following || []).length }}</div>
          <div>Followers: {{ (currentUserDoc.followers || []).length }}</div>
        </div>
        <div v-else-if="currentUser">
          <div><strong>{{ currentUser.username }}</strong></div>
          <div>Loading...</div>
        </div>
        <div v-else>
          <span>Not Logged in</span>
        </div>
        
        <LogOutButton v-if="currentUser" :logOut="handleLogout" />
        <LoginButton v-else />
        
        <div v-if="currentUser" class="toggle-section">
          <button @click="togglePostView" class="toggle-btn">
            {{ getToggleButtonText() }}
          </button>
        </div>
      </div>

      <div class="center-column">
        <CreatePost v-if="currentUser" :onPost="handlePost" />
        
        <div class="post-header">
          <h2>{{ getHeaderText() }}</h2>
        </div>
        
        <PostFeed :posts="getCurrentPosts()" />
        
        <div v-if="viewMode === 'user' && userPosts.length === 0" class="no-posts">
          <p>You have no posts yet. Create your first post!</p>
        </div>
        
        <div v-if="viewMode === 'selected' && selectedUserPosts.length === 0" class="no-posts">
          <p>{{ selectedUser.email }} has no posts yet.</p>
        </div>
      </div>

      <div class="right-column">
        <Followers
          :users="suggestedUsers"
          :canFollow="!!currentUser"
          :onFollow="handleFollow"
          :onUserClick="handleUserClick"
          title="Suggested Users"
        />
        
        <!-- Following Section -->
        <div v-if="currentUser && followingUsers.length > 0" class="following-section">
          <h3>Following</h3>
          <div class="following-list">
            <div 
              v-for="user in followingUsers" 
              :key="user.id"
              class="following-user-item"
            >
              <div class="following-user-info">
                <RouterLink 
                  :to="`/user/${user.id}`" 
                  class="following-user-link"
                >
                  <span class="following-username">{{ user.email.split('@')[0] }}</span>
                </RouterLink>
                <div class="following-user-stats">
                  <span class="stat">{{ (user.posts || []).length }} posts</span>
                  <span class="stat">{{ (user.followers || []).length }} followers</span>
                </div>
              </div>
              <button 
                @click="handleUnfollow(user)"
                class="unfollow-btn"
                title="Unfollow"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
        
      
        <div v-else-if="currentUser && followingUsers.length === 0" class="no-following">
          <h3>Following</h3>
          <p>You're not following anyone yet. Discover new people in the suggested users above!</p>
        </div>
      </div>
      
    </div>
  </main>
</template>

<style scoped>
.main-columns {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  margin-top: 70px;
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
  padding: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: none;
}

.card {
  background: #f1eed8d6;
  color: #333;
  padding: 1.2rem 1rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.card-divider {
  border: none;
  border-top: 1.5px solid #2196f3;
  margin: 0.5rem 0 1rem 0;
}

.following-section h3,
.no-following h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  text-align: left;
  border: none;
  padding-bottom: 0;
}

.following-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.following-user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 0.5rem;
}

.following-user-info {
  flex: 1;
}

.following-user-link {
  text-decoration: none;
  color: inherit;
}

.following-username {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.following-user-stats {
  display: flex;
  gap: 0.5rem;
}

.stat {
  font-size: 0.75rem;
  color: #666;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.unfollow-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.unfollow-btn:hover {
  background: #dc3545;
  transform: translateY(-1px);
}

.unfollow-btn:hover::after {
  content: " ✗";
}

.no-following {
  margin-top: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.no-following h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.no-following p {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .main-columns {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .left-column, .right-column {
    flex: none;
  }
  
  .following-section {
    margin-top: 1rem;
  }
  
  .following-user-item {
    padding: 0.5rem;
  }
  
  .following-username {
    font-size: 0.9rem;
  }
  
  .stat {
    font-size: 0.7rem;
  }
  
  .unfollow-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>