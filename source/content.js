// https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari
// xcrun safari-web-extension-converter distribution/
;(() => {
  const PAGE_REGEX = /^https:\/\/github.com\/[\w-]+\/[\w-]+\/(pulls?|issues?)\/[\d]+/
  const CONTAINER_ID = 'sidebar-comments-index'
  const $ = (el, qs) => el.querySelector(qs)
  const $$ = (el, qs) => el.querySelectorAll(qs)

  function tableOfComments() {
    const minimap = []

    const querySelectors = [
      '.TimelineItem.js-comment-container',
      '.js-timeline-item .js-comment .TimelineItem:first-child',
      '.ajax-pagination-form',
    ]
    const comments = $$(document, querySelectors.join(','))
    comments.forEach(comment => {
      // for showing the "Load more items..." pagination, insert a break
      if ($(comment, '.ajax-pagination-btn')) {
        minimap.push(`<div class="pagination-loader-container" style="height:24px"></div>`)
        return
      }

      // comments without a date are minimized, so skip
      const date = $(comment, 'a.js-timestamp')
      if (!date) {
        return
      }

      const avatarURL = $(comment, '.avatar')?.src || $(comment, '.avatar img')?.src
      const userName = $(comment, 'strong a')?.innerText
      const isBot = /\/apps\//.test($(comment, 'strong a')?.href || '')
      const href = date.href
      const timestamp = $(date, 'relative-time')?.innerText

      const emojiElements = $$(comment, '.js-comment-reactions-options g-emoji')
      const emojis = Array.prototype.map.call(emojiElements, emoji => emoji.innerText)
      const uniqueEmojis = [...new Set(emojis)]

      const row = `
          <p style="margin-bottom:4px">
            <img height="16" src="${avatarURL}" style="border-radius:${
        isBot ? 3 : 16
      }px;vertical-align:text-bottom" width="16" />
            <a href="${href}" style="margin-left:2px">${userName}</a>
            <time style="color:var(--color-fg-muted);font-size:12px;margin-left:2px">${timestamp}</time>
            <span>${uniqueEmojis.map(emoji => `<span style="margin-left:2px">${emoji}</span>`).join('')}</span>
          </p>
        `

      minimap.push(row)
    })

    const containerStyles = [
      'border-top: 1px solid var(--color-border-muted)',
      'margin-top: 16px',
      'max-height: calc(100vh - 80px)',
      'overflow: auto',
      'padding-top: 16px',
      'position: sticky',
      'top: 58px',
    ]
    const container = `
      <div id="${CONTAINER_ID}" style="${containerStyles.join(';')}">
        <div class="discussion-sidebar-heading text-bold">
          Comments
          <kbd style="margin-left:8px">shift ⬆/⬇</kbd>
        </div>
        ${minimap.join('')}
      </div>
    `

    // cleanup before inserting just in case
    const containerNode = document.getElementById(CONTAINER_ID)
    if (containerNode) {
      containerNode.parentNode.removeChild(containerNode)
    }

    // insert node
    $(document, '.Layout-sidebar').innerHTML += container
  }

  document.addEventListener('turbo:load', () => {
    if (PAGE_REGEX.test(location.href)) {
      try {
        tableOfComments()
      } catch (error) {
        console.error('GitHub Minimap error:', error)
      }
    }
  })

  document.addEventListener('keydown', event => {
    const HEADER_HEIGHT = 68
    const BUFFER = 8
    const { key, shiftKey } = event
    if (shiftKey && ['ArrowDown', 'ArrowUp'].includes(key)) {
      if (!PAGE_REGEX.test(location.href)) {
        return
      }
      const links = $$(document, `#${CONTAINER_ID} a`)
      const anchors = Array.prototype.map.call(links, link => link.href)
      if (key === 'ArrowUp') {
        anchors.reverse()
      }
      anchors.every(anchor => {
        const [, id] = anchor.split('#')
        const comment = document.getElementById(id)
        const { top } = comment.getBoundingClientRect()
        if (
          (key === 'ArrowDown' && top > HEADER_HEIGHT + BUFFER) ||
          (key === 'ArrowUp' && top < HEADER_HEIGHT - BUFFER)
        ) {
          window.scrollBy(0, top - HEADER_HEIGHT)
          history.replaceState({}, '', `#${id}`)
          return false
        }
        return true
      })
    }
  })
})()
