<template>
  <div>
    <UserStat :user="user" />
    <Followers :users="followers" :canFollow="canFollow" :onFollow="onFollow" title="Suggested Followers" />
  </div>
  <LogOutButton/>
</template>

<script setup>
import UserStat from '@/components/UserStat.vue';
import Followers from '@/components/Followers.vue';
import LogOutButton from '@/components/LogOutButton.vue';

defineProps(['user', 'followers', 'canFollow', 'onFollow']);
</script>
