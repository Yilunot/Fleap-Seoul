import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock Firebase functions first
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getFirestore: vi.fn(),
  initializeApp: vi.fn()
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn()
}))

// Mock firebaseResources
vi.mock('../../firebaseResources', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}))

// Import component after mocks
import PostItem from '../PostItem.vue'

describe('PostItem', () => {
  const mockPost = {
    id: 'test-post-1',
    author: 'test@example.com',
    content: 'This is a test post',
    timestamp: { seconds: 1640995200 }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders post content correctly', () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    expect(wrapper.text()).toContain('test@example.com')
    expect(wrapper.text()).toContain('This is a test post')
  })

  it('shows like and dislike buttons', () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    const likeBtn = wrapper.find('.like-btn')
    const dislikeBtn = wrapper.find('.dislike-btn')

    expect(likeBtn.exists()).toBe(true)
    expect(dislikeBtn.exists()).toBe(true)
    expect(likeBtn.text()).toContain('👍')
    expect(dislikeBtn.text()).toContain('👎')
  })

  it('formats timestamp correctly', () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    // Check that the date is formatted (not exact date due to timezone)
    expect(wrapper.text()).toMatch(/\w{3} \d{1,2}, \d{4}/)
  })

  it('handles empty reactions correctly', () => {
    const wrapper = mount(PostItem, {
      props: { post: mockPost }
    })

    // Should show 0 for both like and dislike counts initially
    expect(wrapper.text()).toContain('👍 0')
    expect(wrapper.text()).toContain('👎 0')
  })
})