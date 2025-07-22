import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock Firebase functions
const mockReactions = []

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ 
    docs: mockReactions.map(r => ({ 
      id: r.id, 
      data: () => r 
    }))
  })),
  addDoc: vi.fn((ref, data) => {
    const newReaction = { id: Date.now().toString(), ...data }
    mockReactions.push(newReaction)
    return Promise.resolve({ id: newReaction.id })
  }),
  deleteDoc: vi.fn((docRef) => {
    const index = mockReactions.findIndex(r => r.id === docRef.id)
    if (index > -1) mockReactions.splice(index, 1)
    return Promise.resolve()
  }),
  doc: vi.fn((db, path) => ({ id: path.split('/').pop() })),
  getFirestore: vi.fn(),
  initializeApp: vi.fn(),
  query: vi.fn(),
  where: vi.fn()
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn()
}))

vi.mock('../../firebaseResources', () => ({
  auth: {
    currentUser: { uid: 'test-user' }
  },
  db: {}
}))

import PostItem from '../PostItem.vue'

describe('PostItem Like/Dislike Integration', () => {
  const mockPost = {
    id: 'test-post-1',
    author: 'test@example.com',
    content: 'Test post',
    timestamp: { seconds: 1640995200 }
  }

  beforeEach(() => {
    mockReactions.length = 0
    vi.clearAllMocks()
  })

  it('renders without errors', async () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.like-btn').exists()).toBe(true)
    expect(wrapper.find('.dislike-btn').exists()).toBe(true)
  })

  it('displays correct initial counts', async () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('👍 0')
    expect(wrapper.text()).toContain('👎 0')
  })
})