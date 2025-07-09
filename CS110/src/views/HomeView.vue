<script setup>
import { useUserStore } from '../stores/user.js'
import { ref } from 'vue'
import PostFeed from '@/components/PostFeed.vue'
import Followers from '@/components/Followers.vue'
import LoginButton from '@/components/LoginButton.vue'
import CreatePost from '@/components/CreatePost.vue'
import UserStats from '@/components/UserStats.vue'
import LogOutButton from '@/components/LogOutButton.vue'

const userStore = useUserStore()

const publicPosts = ref([
  { id: 1, author: 'Alice01@gmail.com', date: '2025-07-07', content: 'Hello world!' },
  { id: 2, author: 'Bob02@gmail.com', date: '2025-07-08', content: 'This is awesome!' },
  { id: 3, author: 'Carol03@gmail.com', date: '2025-07-09', content: 'I Love Korea!' }
])
const userPosts = ref([
  { id: 4, author: userStore.user?.username || '', date: '2025-07-09', content: 'My first post!' }
])
const suggestedUsers = ref([
  { id: 1, username: 'Alice01@gmail.com' },
  { id: 2, username: 'Bob02@gmail.com' },
  { id: 3, username: 'Carol03@gmail.com' },
  { id: 4, username: 'Dave04@gmail.com' },
  { id: 5, username: 'Eve05@gmail.com' },
  { id: 6, username: 'Frank06@gmail.com' }
])

function handlePost(content) {
  userPosts.value.unshift({
    id: Date.now(),
    author: userStore.user.username,
    date: new Date().toISOString().slice(0, 10),
    content
  })
}

function handleFollow(userId) {
  alert(`Followed user with id: ${userId}`)
}
</script>

<template>
  <main>
    <div class="main-columns">
      <div class="left-column">
        <UserStats :user="userStore.user" />
        <LogOutButton v-if="userStore.user" :logOut="userStore.logout" />
        <LoginButton v-else />
      </div>

      <div class="center-column">
        <CreatePost v-if="userStore.user" :onPost="handlePost" />
        <PostFeed :posts="userStore.user ? userPosts : publicPosts" />
      </div>

      <div class="right-column">
        <Followers
          :users="suggestedUsers"
          :canFollow="!!userStore.user"
          :onFollow="handleFollow"
          title="Suggested Followers"
        />
      </div>
    </div>
  </main>
</template>


