import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginButton from '../LoginButton.vue'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('LoginButton', () => {
  it('renders login button', () => {
    const wrapper = mount(LoginButton)
    
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Log In')
  })

  it('navigates to login page when clicked', async () => {
    const wrapper = mount(LoginButton)
    
    await wrapper.find('button').trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})