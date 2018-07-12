module.exports = bot => {
    let backEmoji = "\u25C0"
    let nextEmoji = "\u25B6"
    let numbersEmoji = "\uD83D\uDD22"
    let stopEmoji = "\u23F9"

    bot.pages = {
        list: {},
        displayCount: 15,
        async add(msg, query, data, handler, displayCount) {
            let page = {
                msg: msg,
                query: query,
                data: data,
                handle(to) {
                    let displayCount = this.displayCount || pages.displayCount
                    this.lastPage = Math.ceil(this.data.length / displayCount)
                    if (typeof to === "boolean") {
                        this.page = Math.max(1, Math.min(this.page + (to && 1 || -1), this.lastPage))
                    } else if (typeof to === "number") {
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

            await msg.react(backEmoji)
            await msg.react(nextEmoji)
            await msg.react(numbersEmoji)
            await msg.react(stopEmoji)

            return page
        }
    }

    function onReaction(reaction, user) {
        if (user.id == bot.client.user.id) { return }

        let page = bot.pages.list[reaction.message.id]
        if (page) {
            if (user.id != page.query.author.id) { return }

            let emoji = reaction.emoji.name
            if (emoji == backEmoji || emoji == nextEmoji) {
                let fwd = emoji == nextEmoji
                page.handle(fwd)
            } else if (emoji == stopEmoji) {
                page.msg.delete()
            } else if (emoji == numbersEmoji && !page.switching) {
                page.query.reply("which page do you want to go to?")
                    .then(msg => {
                        page.switching = {
                            msg: msg,
                            timeout: Date.now() / 1000 + 30
                        }
                    })
            }
        }
    }
    bot.client.on("messageReactionAdd", onReaction)
    bot.client.on("messageReactionRemove", onReaction)
    bot.client.on("message", msg => {
        if (msg.author.id == bot.client.user.id) { return }

        let num = parseInt(msg.content.toLowerCase().trim(), 10)

        for (const id in bot.pages.list) {
            if (bot.pages.list.hasOwnProperty(id)) {
                const page = bot.pages.list[id]
                if (page.switching && msg.author.id == page.query.author.id) {
                    if (page.switching.timeout > Date.now() / 1000) {
                        if (isNaN(num)) { msg.reply("invalid page number."); return false }

                        num = Math.floor(Math.max(1, Math.min(num, page.lastPage)))

                        page.switching.msg.delete()
                        msg.delete()

                        page.handle(num)
                        page.switching = undefined
                        return false
                    } else {
                        page.switching = undefined
                    }
                }
            }
        }
    })
}
