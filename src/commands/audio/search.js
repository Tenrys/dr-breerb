const Discord = require("discord.js")

module.exports = (category, bot) => {
    category.addCommand("search", function(msg, line, ...options) {
        if (options && typeof options[0] == "object") {
            options = options[0]
        } else {
            options = undefined
        }

        if (!bot.soundListKeys) { msg.reply("sound list hasn't loaded yet."); return }

        line = line.toLowerCase()

        let res = []
        forin(bot.soundListKeys, name => {
            if (name.toLowerCase().trim().includes(line)) {
                res.push(name)
            }
        })
        if (res.length <= 0) {
            msg.reply("couldn't find any chatsound.")
            return null
        }
        res.sort(function(a, b) {
            return 	a.length - b.length || // sort by length, if equal then
                    a.localeCompare(b)     // sort by dictionary order
        })

        let handler = async function(to) {
            let displayCount = this.displayCount || bot.pages.displayCount
            let buf = ""
            for (let i = displayCount * (this.page - 1); i < displayCount * this.page; i++) {
                if (!this.data[i]) { break }
                buf = buf + (i + 1) + `. \`${this.data[i]}\`\n`
            }

            let embed = new Discord.MessageEmbed()
                .setAuthor(msg.author.tag, msg.author.avatarURL())
                .setTitle("Chatsound search results")
                .setDescription(buf)
                .setFooter(`Page ${this.page}/${this.lastPage} (${this.data.length} entries)`)

            let res = this.msg
            if (!res) {
                res = await msg.channel.send(options ? options.content : "", embed)
            } else {
                await this.msg.edit(embed)
            }

            return res
        }
        return bot.pages.add(null, msg, res, handler, options ? options.displayCount : null)
    }, {
        aliases: [ "find" ],
        help: "Searches chatsounds by name."
    })
}
