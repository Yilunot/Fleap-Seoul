<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebaseResources'
import { collection, getDocs, addDoc, query, orderBy, where, serverTimestamp, doc, updateDoc, arrayUnion, getDoc, limit } from 'firebase/firestore'
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
const viewMode = ref('all') // 'all', 'user', 'selected'

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
      const userDoc = querySnapshot.docs[0]
      currentUserDoc.value = {
        id: userDoc.id,
        ...userDoc.data()
      }
      console.log('✅ Current user document loaded:', currentUserDoc.value)
    } else {
      console.log('❌ No user document found')
    }
  } catch (error) {
    console.error('Error loading current user document:', error)
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
    return 'Show My Posts'
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
  background: #f1eed8d6;
  color: #333;
  padding: 1rem;
  border-radius: 8px;
  height: fit-content;
}

.toggle-section {
  margin-top: 1rem;
}

.post-header {
  text-align: center;
  margin-bottom: 1rem;
}

.post-header h2 {
  color: #333;
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
</style>