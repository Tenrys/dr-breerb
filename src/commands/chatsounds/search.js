const Discord = require.main.require("./src/extensions/discord.js")

module.exports = (category, bot) => {
    category.addCommand("search", (msg, line, ...options) => {
        if (options && typeof options[0] === "object") {
            options = options[0]
        } else {
            options = undefined
        }

        if (!bot.soundListKeys) { msg.error("Sound list hasn't loaded yet.", category.printName); return }

        line = line.toLowerCase()

        let res = []
        for (const name in bot.soundListKeys) {
            if (bot.soundListKeys.hasOwnProperty(name)) {
                if (name.toLowerCase().trim().includes(line)) {
                    res.push(name)
                }
            }
        }
        if (res.length <= 0) {
            msg.error("Couldn't find any chatsound.", category.printName)
            return null
        }
        res.sort((a, b) => {
            return 	a.length - b.length || // sort by length, if equal then
                    a.localeCompare(b)     // sort by dictionary order
        })

        return bot.pages.add(null, msg, res, async function() {
            let displayCount = this.displayCount || bot.pages.displayCount
            let buf = ""
            for (let i = displayCount * (this.page - 1); i < displayCount * this.page; i++) {
                if (!this.data[i]) { break }
                buf = buf + (i + 1) + `. \`${this.data[i]}\`\n`
            }

            let embed = new Discord.MessageEmbed()
                .setAuthor(msg.author.tag, msg.author.avatarURL())
                .setTitle(category.printName + ": Search results")
                .setDescription(bot.truncate(buf))
                .setFooter(`Page ${this.page}/${this.lastPage} (${this.data.length} entries)`)

            let res = this.msg
            if (!res) {
                res = await msg.channel.send(options ? options.content : "", embed)
            } else {
                await this.msg.edit(embed)
            }

            return res
        }, options ? options.displayCount : null)
    }, {
        aliases: [ "find" ],
        help: "Searches chatsounds by name."
    })
}
