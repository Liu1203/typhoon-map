import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../sanitize'

describe('sanitizeHtml', () => {
  it('removes scripts and event handlers', () => {
    const html = '<p>Hello</p><img src=x onerror="alert(1)"><script>alert(2)</script>'

    const result = sanitizeHtml(html)

    expect(result).toContain('<p>Hello</p>')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('onerror')
  })

  it('removes dangerous link protocols while keeping safe markup', () => {
    const html = '<a href="javascript:alert(1)">bad</a><mark class="search-highlight">Vue</mark>'

    const result = sanitizeHtml(html)

    expect(result).toContain('<a>bad</a>')
    expect(result).toContain('<mark class="search-highlight">Vue</mark>')
    expect(result).not.toContain('javascript:')
  })
})
