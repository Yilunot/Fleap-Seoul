import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PostFeed from '../PostFeed.vue'
import PostItem from '../PostItem.vue'

describe('PostFeed', () => {
  const mockPosts = [
    {
      id: '1',
      author: 'user1@example.com',
      content: 'First post',
      timestamp: { seconds: 1640995200 }
    },
    {
      id: '2',
      author: 'user2@example.com',
      content: 'Second post',
      timestamp: { seconds: 1640995300 }
    }
  ]

  it('renders all posts', () => {
    const wrapper = mount(PostFeed, {
      props: { posts: mockPosts },
      global: {
        stubs: {
          PostItem: true
        }
      }
    })

    const postItems = wrapper.findAllComponents(PostItem)
    expect(postItems).toHaveLength(2)
  })

  it('renders empty feed when no posts', () => {
    const wrapper = mount(PostFeed, {
      props: { posts: [] },
      global: {
        stubs: {
          PostItem: true
        }
      }
    })

    const postItems = wrapper.findAllComponents(PostItem)
    expect(postItems).toHaveLength(0)
  })

  it('passes correct props to PostItem components', () => {
    const wrapper = mount(PostFeed, {
      props: { posts: mockPosts },
      global: {
        stubs: {
          PostItem: true
        }
      }
    })

    const postItems = wrapper.findAllComponents(PostItem)
    expect(postItems[0].props('post')).toEqual(mockPosts[0])
    expect(postItems[1].props('post')).toEqual(mockPosts[1])
  })
})