const bot = require("./index.js")

let pages = {
	list: {},
	displayCount: 15,
	async add(msg, query, data, handler, displayCount) {
		let page = {
			msg: msg,
			query: query,
			data: data,
			handle(to) {
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

		if (!msg) { msg = await page.handle(null) }
		page.msg = msg

		this.list[msg.id] = page

		await msg.react("◀")
		await msg.react("▶")
		await msg.react("🔢")
		await msg.react("⏹")

		return page
	}
}

/**
 * Get the current time in seconds.
 */
function time() {
	return new Date().getTime() / 1000
}

function onReaction(reaction, user) {
	if (user.id == this.user.id) { return }

	let page = pages.list[reaction.message.id]
	if (page) {
		if (user.id != page.query.author.id) { return }

		let emoji = reaction.emoji.name
		if (emoji == "◀" || emoji == "▶") {
			let fwd = emoji == "▶"
			page.handle(fwd)
		} else if (emoji == "⏹") {
			page.message.delete()
		} else if (emoji == "🔢" && !page.switching) {
			page.query.reply("which page do you want to go to?")
				.then(msg => {
					page.switching = {
						message: msg,
						timeout: time() + 30
					}
				})
		}
	}
}
bot.client.on("messageReactionAdd", onReaction)
bot.client.on("messageReactionRemove", onReaction)
bot.client.on("message", function(msg) {
	if (msg.author.id == this.user.id) { return }

	let num = parseInt(msg.content.toLowerCase().trim(), 10)

	forin(pages.list, (id, page) => {
		if (page.switching && msg.author.id == page.query.author.id) {
			if (page.switching.timeout > time()) {
				if (isNaN(num)) { msg.reply("invalid page number."); return false }

				num = Math.floor(Math.max(1, Math.min(num, page.lastPage)))

				page.switching.message.delete()
				msg.delete()

				page.handle(num)
				page.switching = undefined
				return false
			} else {
				page.switching = undefined
			}
		}
	})
})

module.exports = pages
