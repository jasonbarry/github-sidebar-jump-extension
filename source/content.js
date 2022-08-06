// https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari
// xcrun safari-web-extension-converter distribution/
;(() => {
  const PAGE_REGEX = /^https:\/\/github.com\/[\w-]+\/[\w-]+\/(pulls?|issues?)\/[\d]+/
  const CONTAINER_ID = 'sidebar-jump-index'
  const GH_STICKY_HEADER_HEIGHT = 68
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
        <p>
          <img height="16" src="${avatarURL}" style="border-radius:${isBot ? 3 : 16}px;" width="16" />
          <a class="sidebar-jump" href="${href}" style="margin-left:2px">${userName}</a>
          <time>${timestamp}</time>
          <span>${uniqueEmojis.map(emoji => `<span style="margin-left:2px">${emoji}</span>`).join('')}</span>
        </p>
      `

      minimap.push(row)
    })

    const container = `
      <div id="${CONTAINER_ID}">
        <div class="discussion-sidebar-heading text-bold">
          Comments
          <kbd>shift ⬆/⬇</kbd>
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
      links.every(link => {
        const anchor = link.href
        const [, id] = anchor.split('#')
        const comment = document.getElementById(id)
        const { top } = comment.getBoundingClientRect()
        if (
          (key === 'ArrowDown' && top > GH_STICKY_HEADER_HEIGHT + BUFFER) ||
          (key === 'ArrowUp' && top < GH_STICKY_HEADER_HEIGHT - BUFFER)
        ) {
          window.scrollBy(0, top - GH_STICKY_HEADER_HEIGHT)
          link.focus()
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
      const comment = document.getElementById(id)
      const { top } = comment.getBoundingClientRect()
      window.scrollBy(0, top - GH_STICKY_HEADER_HEIGHT)
      history.replaceState({}, '', `#${id}`)
    }
  })
})()
