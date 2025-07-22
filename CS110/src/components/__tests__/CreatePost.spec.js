import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CreatePost from '../CreatePost.vue'

describe('CreatePost', () => {
  it('renders correctly', () => {
    const mockOnPost = vi.fn()
    const wrapper = mount(CreatePost, {
      props: { onPost: mockOnPost }
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Post')
  })

  it('calls onPost when submitting valid content', async () => {
    const mockOnPost = vi.fn()
    const wrapper = mount(CreatePost, {
      props: { onPost: mockOnPost }
    })

    const textarea = wrapper.find('textarea')
    const button = wrapper.find('button')

    await textarea.setValue('Test post content')
    await button.trigger('click')

    expect(mockOnPost).toHaveBeenCalledWith('Test post content')
  })

  it('does not submit empty content', async () => {
    const mockOnPost = vi.fn()
    const wrapper = mount(CreatePost, {
      props: { onPost: mockOnPost }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(mockOnPost).not.toHaveBeenCalled()
  })

  it('clears textarea after successful post', async () => {
    const mockOnPost = vi.fn()
    const wrapper = mount(CreatePost, {
      props: { onPost: mockOnPost }
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test content')
    
    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.vm.text).toBe('')
  })
})