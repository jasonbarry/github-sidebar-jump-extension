;(() => {
  const PAGE_REGEX = /^https:\/\/github.com\/[\w-]+\/[\w-]+\/(pulls?|issues?)\/\d+/
  const CONTAINER_ID = 'sidebar-jump-index'
  const GH_STICKY_HEADER_HEIGHT = 84
  const $ = (element, qs) => element.querySelector(qs)
  const $$ = (element, qs) => element.querySelectorAll(qs)

  function tableOfComments() {
    const minimap = []

    const querySelectors = [
      '.TimelineItem.js-comment-container',
      '.js-timeline-item .js-comment .TimelineItem:first-child',
      '.ajax-pagination-form',
    ]
    const comments = $$(document, querySelectors.join(','))
    for (const [i, comment] of comments.entries()) {
      // For showing the "Load more items..." pagination, insert a break
      if ($(comment, '.ajax-pagination-btn')) {
        minimap.push(`<div class="pagination-loader-container" style="height:24px"></div>`)
        continue
      }

      // Comments without a date are minimized, so skip
      const date = $(comment, 'a.js-timestamp')
      if (!date) {
        continue
      }

      // Also skip resolved comments
      if (i > 0 && $(comment.parentNode, 'details[data-resolved="true"]')) {
        continue
      }

      const avatarURL = $(comment, '.avatar')?.src || $(comment, '.avatar img')?.src
      const userName = $(comment, 'strong a')?.textContent
      const isBot = /\/apps\//.test($(comment, 'strong a')?.href || '')
      const href = date.href
      const timestamp = $(date, 'relative-time')?.textContent

      const emojiElements = $$(comment, '.js-comment-reactions-options g-emoji')
      const emojis = Array.prototype.map.call(emojiElements, emoji => emoji.textContent)
      const uniqueEmojis = [...new Set(emojis)]

      const row = `
        <p>
          <img height="16" src="${avatarURL}" style="border-radius:${isBot ? 3 : 16}px;" width="16" />
          <a class="sidebar-jump" href="${href}" style="margin-left:2px">${userName}</a>
          <time>${timestamp}</time>
          <span>${uniqueEmojis.map(emoji => `<span style="margin-left:2px">${emoji}</span>`).join('')}</span>
        </p>
      `

      minimap.push(row)
    }

    const container = `
      <div id="${CONTAINER_ID}">
        <div class="discussion-sidebar-heading text-bold">
          Comments
          <kbd>shift ⬆/⬇</kbd>
        </div>
        ${minimap.join('')}
      </div>
    `

    // Cleanup before inserting just in case
    const containerNode = $(document, `#${CONTAINER_ID}`)
    if (containerNode) {
      containerNode.remove()
    }

    // Insert node
    $(document, '.Layout-sidebar').innerHTML += container
  }

  document.addEventListener('turbo:load', () => {
    if (PAGE_REGEX.test(location.href)) {
      try {
        tableOfComments()
      } catch (error) {
        console.error('GitHub Sidebar Jump extension error:', error)
      }
    }
  })

  document.addEventListener('keydown', event => {
    const BUFFER = 8
    const { key, shiftKey } = event
    if (shiftKey && ['ArrowDown', 'ArrowUp'].includes(key)) {
      if (!PAGE_REGEX.test(location.href)) {
        return
      }

      const links = Array.from($$(document, `#${CONTAINER_ID} a`))
      if (key === 'ArrowUp') {
        links.reverse()
      }

      links.every((link, i) => {
        const [, id] = link.href.split('#')
        const comment = $(document, `#${id}-permalink`)
        const { top } = comment.getBoundingClientRect()
        if (
          (key === 'ArrowDown' && top > GH_STICKY_HEADER_HEIGHT + BUFFER) ||
          (key === 'ArrowUp' && top < GH_STICKY_HEADER_HEIGHT - BUFFER)
        ) {
          window.scrollBy(0, top - GH_STICKY_HEADER_HEIGHT)
          // Don't set focus on the link to the first comment, as
          // it interferes with scrolling since the sticky sidebar will be out of viewport
          if ((key === 'ArrowDown' && i > 0) || (key === 'ArrowUp' && i < links.length - 1)) {
            link.focus()
          }

          history.replaceState({}, '', `#${id}`)
          return false
        }

        return true
      })
    }
  })

  document.addEventListener('click', event => {
    const link = event.target
    if (link.classList.contains('sidebar-jump')) {
      event.preventDefault()
      const [, id] = link.href.split('#')
      const comment = $(document, `#${id}-permalink`)
      const { top } = comment.getBoundingClientRect()
      window.scrollBy(0, top - GH_STICKY_HEADER_HEIGHT)
      history.replaceState({}, '', `#${id}`)
    }
  })
})()
