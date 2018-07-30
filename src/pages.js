module.exports = bot => {
    let backEmoji = "\u25C0"
    let nextEmoji = "\u25B6"
    let numbersEmoji = "\uD83D\uDD22"
    let stopEmoji = "\u23F9"

    bot.pages = new class PageStore {
        constructor() {
            this.displayCount = 15
        }

        async add(query, data, handler, options) {
            if (options === undefined || options === null || typeof options !== "object") { options = {} }

            let page = {
                query: query,
                data: data,
                handle(to) {
                    if (!this.page) this.page = 1
                    this.lastPage = Math.ceil(this.data.length / this.displayCount)
                    if (typeof to === "boolean") this.page = Math.max(1, Math.min(this.page + (to && 1 || -1), this.lastPage))
                    else if (typeof to === "number") this.page = to

                    return handler.call(this, to) // It's up to the handler to manage the result
                },
                displayCount: options.displayCount || this.displayCount
            }

            let result = await page.handle()
            await result.react(backEmoji)
            await result.react(nextEmoji)
            await result.react(numbersEmoji)
            await result.react(stopEmoji)

            page.result = result
            this[result.id] = page
            return page
        }
    }

    async function onReaction(reaction, user) {
        if (user.id == bot.client.user.id) return

        let page = bot.pages[reaction.message.id]
        if (page) {
            if (user.id != page.query.author.id) return

            let emoji = reaction.emoji.name
            if (emoji == backEmoji || emoji == nextEmoji) {
                let fwd = emoji == nextEmoji
                page.handle(fwd)
            } else if (emoji == numbersEmoji && !page.switching) {
                let msg = await page.query.reply("which page do you want to go to?")
                page.switching = {
                    msg: msg,
                    timeout: Date.now() / 1000 + 30
                }
            } else if (emoji == stopEmoji) page.result.delete()
        }
    }

    bot.client.on("messageReactionAdd", onReaction)
    bot.client.on("messageReactionRemove", onReaction)
    bot.client.on("message", async msg => { // Page navigation by sending a number
        if (msg.author.id == bot.client.user.id) return

        let num = parseInt(msg.content.toLowerCase().trim(), 10)

        for (const id in bot.pages) {
            if (bot.pages.hasOwnProperty(id)) {
                const page = bot.pages[id]
                if (page.switching && msg.author.id == page.query.author.id) {
                    if (page.switching.timeout > Date.now() / 1000) {
                        if (isNaN(num)) {
                            let invalidMsg = await msg.reply("invalid page number.")
                            msg.client.setTimeout(invalidMsg.delete.bind(invalidMsg), 10000)
                            return false
                        }

                        num = Math.floor(Math.max(1, Math.min(num, page.lastPage)))
                        page.handle(num)

                        page.switching.msg.delete()
                        msg.delete()
                        delete page.switching
                        return false
                    } else delete page.switching
                }
            }
        }
    })
}
