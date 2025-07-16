<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebaseResources'
import { collection, getDocs, addDoc, query, orderBy, where, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import PostFeed from '@/components/PostFeed.vue'
import Followers from '@/components/Followers.vue'
import LoginButton from '@/components/LoginButton.vue'
import CreatePost from '@/components/CreatePost.vue'
import UserStats from '@/components/UserStats.vue'
import LogOutButton from '@/components/LogOutButton.vue'

const currentUser = ref(null)
const currentUserDoc = ref(null) // Store the user document
const publicPosts = ref([])
const userPosts = ref([])
const suggestedUsers = ref([])
const showUserPosts = ref(false)

// Watch for auth state changes
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = {
        email: user.email,
        username: user.email.split('@')[0],
        uid: user.uid
      }
      await loadCurrentUserDoc()
      loadUserPosts()
    } else {
      currentUser.value = null
      currentUserDoc.value = null
    }
  })
  loadPublicPosts()
  loadSuggestedUsers()
})

// Load current user's document from Firestore
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

// Load posts for logged-in users (from their feed) or public posts
async function loadPublicPosts() {
  try {
    if (currentUserDoc.value && currentUserDoc.value.feed && currentUserDoc.value.feed.length > 0) {
      // Load posts from user's feed (most recent 10)
      const feedPostIds = currentUserDoc.value.feed.slice(-10).reverse()
      const feedPosts = []
      
      for (const postId of feedPostIds) {
        const postDoc = await getDoc(doc(db, 'posts', postId))
        if (postDoc.exists()) {
          feedPosts.push({ id: postDoc.id, ...postDoc.data() })
        }
      }
      publicPosts.value = feedPosts
    } else {
      // Load 10 most recent posts from all posts
      const postsRef = collection(db, 'posts')
      const q = query(postsRef, orderBy('timestamp', 'desc'), limit(10))
      const querySnapshot = await getDocs(q)
      publicPosts.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }
  } catch (error) {
    console.error('Error loading public posts:', error)
  }
}

async function loadUserPosts() {
  if (!currentUserDoc.value) return
  try {
    // Load posts from user's posts array
    const userPostIds = currentUserDoc.value.posts || []
    const userPostDocs = []
    
    for (const postId of userPostIds) {
      const postDoc = await getDoc(doc(db, 'posts', postId))
      if (postDoc.exists()) {
        userPostDocs.push({ id: postDoc.id, ...postDoc.data() })
      }
    }
    
    // Sort by timestamp (most recent first)
    userPosts.value = userPostDocs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
  } catch (error) {
    console.error('Error loading user posts:', error)
  }
}

async function loadSuggestedUsers() {
  try {
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)
    
    let allUsers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Filter out current user and users already being followed
    if (currentUserDoc.value) {
      const followingIds = currentUserDoc.value.following || []
      allUsers = allUsers.filter(user => 
        user.email !== currentUser.value?.email && 
        !followingIds.includes(user.id)
      )
    } else {
      allUsers = allUsers.filter(user => user.email !== currentUser.value?.email)
    }
    
    // Get 5 random users
    const shuffled = allUsers.sort(() => 0.5 - Math.random())
    suggestedUsers.value = shuffled.slice(0, 5)
  } catch (error) {
    console.error('Error loading suggested users:', error)
  }
}

// Handle new post creation according to Firestore requirements
async function handlePost(content) {
  if (!currentUser.value || !currentUserDoc.value) return
  
  try {
    // Create new post document
    const newPost = {
      timestamp: serverTimestamp(),
      author: currentUser.value.email,
      content: content
    }
    
    const postRef = await addDoc(collection(db, 'posts'), newPost)
    
    // Update current user's posts array
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      posts: arrayUnion(postRef.id)
    })
    
    // Add post to followers' feeds
    const followers = currentUserDoc.value.followers || []
    for (const followerId of followers) {
      await updateDoc(doc(db, 'users', followerId), {
        feed: arrayUnion(postRef.id)
      })
    }
    
    // Reload data
    await loadCurrentUserDoc()
    await loadUserPosts()
    await loadPublicPosts()
  } catch (error) {
    console.error('Error adding post:', error)
  }
}

// Handle following users according to Firestore requirements
async function handleFollow(userId) {
  if (!currentUser.value || !currentUserDoc.value) return
  
  try {
    // Update current user's following array
    await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
      following: arrayUnion(userId)
    })
    
    // Update target user's followers array
    await updateDoc(doc(db, 'users', userId), {
      followers: arrayUnion(currentUserDoc.value.id)
    })
    
    // Get target user's posts and add to current user's feed
    const targetUserDoc = await getDoc(doc(db, 'users', userId))
    if (targetUserDoc.exists()) {
      const targetUserPosts = targetUserDoc.data().posts || []
      if (targetUserPosts.length > 0) {
        await updateDoc(doc(db, 'users', currentUserDoc.value.id), {
          feed: arrayUnion(...targetUserPosts)
        })
      }
    }
    
    // Reload data
    await loadCurrentUserDoc()
    await loadSuggestedUsers()
    await loadPublicPosts()
  } catch (error) {
    console.error('Error following user:', error)
  }
}

function togglePostView() {
  showUserPosts.value = !showUserPosts.value
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
        <!-- Display user stats from Firestore document -->
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
          <span>Not logged in</span>
        </div>
        
        <LogOutButton v-if="currentUser" :logOut="handleLogout" />
        <LoginButton v-else />
        
        <div v-if="currentUser" class="toggle-section">
          <button @click="togglePostView" class="toggle-btn">
            {{ showUserPosts ? 'Show All Posts' : 'Show My Posts' }}
          </button>
        </div>
      </div>

      <div class="center-column">
        <CreatePost v-if="currentUser" :onPost="handlePost" />
        
        <div class="post-header">
          <h2>{{ showUserPosts ? 'Your Posts' : (currentUser ? 'Your Feed' : 'All Posts') }}</h2>
        </div>
        
        <PostFeed :posts="showUserPosts ? userPosts : publicPosts" />
        
        <div v-if="showUserPosts && userPosts.length === 0" class="no-posts">
          <p>You have no posts yet. Create your first post!</p>
        </div>
      </div>

      <div class="right-column">
        <Followers
          :users="suggestedUsers"
          :canFollow="!!currentUser"
          :onFollow="handleFollow"
          title="Suggested Users"
        />
      </div>
    </div>
  </main>
</template>

<!-- Styles stay the same -->
 
<style scoped>
.toggle-section {
  margin-top: 1rem;
}

.toggle-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  font-size: 14px;
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