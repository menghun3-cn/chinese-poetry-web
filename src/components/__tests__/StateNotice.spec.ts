import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import StateNotice from '@/components/StateNotice.vue'

describe('StateNotice', () => {
  it('渲染标题与描述', () => {
    const wrapper = mount(StateNotice, {
      props: {
        title: '没有匹配的作品',
        description: '减少关键词后重新检索。',
      },
    })

    expect(wrapper.text()).toContain('没有匹配的作品')
    expect(wrapper.text()).toContain('减少关键词后重新检索。')
  })

  it('错误状态提供 alert 语义', () => {
    const wrapper = mount(StateNotice, {
      props: {
        title: '加载失败',
        description: '请稍后重试。',
        tone: 'danger',
      },
    })

    expect(wrapper.attributes('role')).toBe('alert')
  })
})
