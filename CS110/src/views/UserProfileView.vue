<template>
  <main>
    <div class="main-columns">
      <div class="left-column">
        <UserStats :user="user" />
      </div>

      <div class="center-column">
        <PostFeed :posts="userPosts" />
      </div>
      
      <div class="right-column">
        <Followers :users="users.filter(u => u.id == user.id)" :canFollow="true" :onFollow="onFollow" title="Followers" />

      </div>
    </div>
  </main>
</template>

<script setup>
import { useRoute } from 'vue-router'
import UserStats from '@/components/UserStats.vue'
import Followers from '@/components/Followers.vue'
import LogOutButton from '@/components/LogOutButton.vue'
import PostFeed from '@/components/PostFeed.vue'

const users = [
  { id: 1, username: 'Alice01@gmail.com', posts: 5, following: 2, followers: [2,3] },
  { id: 2, username: 'Bob02@gmail.com', posts: 3, following: 1, followers: [1] },
  { id: 3, username: 'Carol03@gmail.com', posts: 2, following: 0, followers: [1,2] },
]

// Mock posts data
const allPosts = [
  { id: 1, author: 'Alice01@gmail.com', date: '2025-07-07', time: '10:00 AM', content: 'Hello world!' },
  { id: 2, author: 'Bob02@gmail.com', date: '2025-07-08', time: '11:00 AM', content: 'This is awesome!' },
  { id: 3, author: 'Carol03@gmail.com', date: '2025-07-09', time: '12:00 PM', content: 'I Love Korea!' },
  { id: 4, author: 'Alice01@gmail.com', date: '2025-07-10', time: '01:00 PM', content: 'Another post by Alice.' }
]

const route = useRoute()
const user = users.find(u => u.username === route.params.username)

// Get follower user objects
const followerUsers = user && user.followers
  ? users.filter(u => user.followers.includes(u.id))
  : []

// Get posts for this user
const userPosts = user
  ? allPosts.filter(post => post.author === user.username)
  : []
</script>
