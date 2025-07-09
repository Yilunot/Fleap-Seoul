<script setup>
import { useRoute } from 'vue-router'
import UserStats from '@/components/UserStats.vue'
import Followers from '@/components/Followers.vue'
import LogOutButton from '@/components/LogOutButton.vue'

// Mock users data
const users = [
  { id: 1, username: 'Alice01@gmail.com', posts: 5, following: 2, followers: 10 },
  { id: 2, username: 'Bob02@gmail.com', posts: 3, following: 1, followers: 7 },
  { id: 3, username: 'Carol03@gmail.com', posts: 2, following: 0, followers: 3 }
]

const route = useRoute()
const user = users.find(u => u.username === route.params.username)
</script>

<template>
  <div>
    <UserStats :user="user" />
    <Followers :users="user.followers" />
    <LogOutButton />
  </div>
</template>