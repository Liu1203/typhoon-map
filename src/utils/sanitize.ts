import DOMPurify from 'dompurify'

const sanitizeConfig = {
  ADD_TAGS: ['mark'],
  ADD_ATTR: ['class', 'id', 'target', 'rel', 'data-code'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, sanitizeConfig)
}
