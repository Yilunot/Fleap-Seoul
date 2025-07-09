<template>
  <div>
    <UserStat :user="user" />
    <Followers :users="followers" :canFollow="canFollow" :onFollow="onFollow" title="Suggested Followers" />
  </div>
</template>

<script setup>
import UserStat from '@/components/UserStats.vue';
import Followers from '@/components/Followers.vue';

defineProps(['user', 'followers', 'canFollow', 'onFollow']);
</script>
