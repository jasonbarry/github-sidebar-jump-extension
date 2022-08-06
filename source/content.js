function tableOfComments() {
	const $ = (qs, el) => (el || document).querySelector(qs);
	const $$ = (qs, el) => (el || document).querySelectorAll(qs);

	const minimap = [];

	try {
		const items = $$(
			".TimelineItem.js-comment-container, .js-timeline-item .js-comment .TimelineItem:first-child, .ajax-pagination-form"
		);
		items.forEach((item) => {
			// for showing the "Load more items..." pagination, insert a break
			if ($(".ajax-pagination-btn", item)) {
				minimap.push(
					`<div class="pagination-loader-container" style="height:24px"></div>`
				);
				return;
			}

			const avatarURL = $(".avatar", item).src || $(".avatar img", item).src;
			const userName = $("strong a", item).innerText;
			const isBot = /\/apps\//.test($("strong a", item).href);
			const date = $("a.js-timestamp", item);
			const href = date.href;
			const timestamp = $("relative-time", date).innerText;

			const emojiElements = $$(".js-comment-reactions-options g-emoji", item);
			const emojis = Array.prototype.map.call(
				emojiElements,
				(emoji) => emoji.innerText
			);
			const uniqueEmojis = [...new Set(emojis)];

			const row = `
        <div style="margin-bottom:4px">
          <img height="16" src="${avatarURL}" style="border-radius:${
				isBot ? 3 : 16
			}px;vertical-align:text-bottom" width="16" />
          <a href="${href}" style="margin-left:2px">${userName}</a>
          <time style="color:#999;font-size:12px;margin-left:2px">${timestamp}</time>
          <span style="font-size:12px;margin-right:2px">${uniqueEmojis
						.map((emoji) => `<span>${emoji}</span>`)
						.join("")}</span>
        </div>
      `;

			minimap.push(row);
		});

		const container = `
      <div id="minimap-container" style="margin-top:32px;position:sticky;top:72px;max-height:calc(100vh - 96px);overflow:auto">
        <div class="discussion-sidebar-heading text-bold">Comments</div>
        ${minimap.join("")}
      </div>
    `;

		const containerNode = $("#minimap-container");
		if (containerNode) {
			containerNode.parentNode.removeChild(containerNode);
		}
		$(".Layout-sidebar").innerHTML += container;
	} catch {}
}

document.addEventListener("turbo:load", () => {
	const regex = /^https:\/\/github.com\/[\w-]+\/[\w-]+\/(pull|issue)\/[\d]+/;
	if (regex.test(location.href)) {
		tableOfComments();
	}
});
