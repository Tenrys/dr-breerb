
let page = {}

page.pages = {}

// TODO: Add number button (pick page num in chat)
page.displayCount = 15
page.init = async function(message, query, data, handler, displayCount) {
	let _page = {
		message: message,
		query: query,
		data: data,
		handle: function(to) {
			let displayCount = this.displayCount || page.displayCount
			this.lastPage = Math.ceil(this.data.length / displayCount)
			if (typeof to == "boolean") {
				this.page = Math.max(1, Math.min(this.page + (to && 1 || -1), this.lastPage))
			} else if (typeof to == "number") {
				this.page = to
			}

			return handler.call(this, to)
		},
		page: 1,
		displayCount: displayCount
	}
	if (!message) { message = await _page.handle(null) }
	_page.message = message
	page.pages[message.id] = _page

	await message.react("◀")
	await message.react("▶")
	await message.react("🔢")
	await message.react("⏹")

	return _page
}

function time() {
	return new Date().getTime() / 1000
}
function onReaction(reaction, user) {
	if (user.id == client.user.id) { return }

	let _page = page.pages[reaction.message.id]
	if (_page) {
		if (user.id != _page.query.author.id) { return }

		let emoji = reaction.emoji.name
		if (emoji == "◀" || emoji == "▶") {
			let fwd = emoji == "▶"
			_page.handle(fwd)
		} else if (emoji == "⏹") {
			_page.message.reactions.removeAll()
		} else if (emoji == "🔢") {
			_page.query.reply("which page do you want to go to?").then(function(msg) {
				_page.switching = {
					message: msg,
					timeout: time() + 30
				}
			})
		}
	}
}
client.on("messageReactionAdd", onReaction)
client.on("messageReactionRemove", onReaction)
client.on("message", function(msg) {
	if (msg.author.id == client.user.id) { return }

	let num = parseInt(msg.content.toLowerCase().trim(), 10)

	for (let id in page.pages) {
		if (page.pages.hasOwnProperty(id)) {
			let _page = page.pages[id];
			if (_page.switching && msg.author.id == _page.query.author.id) {
				if (_page.switching.timeout > time()) {
					if (typeof num !== "number") { msg.reply("invalid page number."); return }

					num = Math.floor(Math.max(1, Math.min(num, _page.lastPage)))

					_page.switching.message.delete()
					msg.delete()

					_page.handle(num)
					_page.switching = undefined
					return
				} else {
					_page.switching = undefined
				}
			}
		}
	}
})

module.exports = page

