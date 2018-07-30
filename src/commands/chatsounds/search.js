const Command = require("@commands/Command.js")

const Discord = require("discord.js")

module.exports = class SearchCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Searches chatsounds by name."
        this.aliases = [ "find" ]
    }

    callback(query, line, ...options) {
        let bot = this.bot
        let categoryName = this.categoryName

        if (options && typeof options[0] === "object") options = options[0]
        else options = undefined

        if (!this.bot.soundListKeys) { query.reply(this.error("Sound list hasn't loaded yet.")); return }

        line = line.toLowerCase()

        let result = []
        for (const name in this.bot.soundListKeys) {
            if (this.bot.soundListKeys.hasOwnProperty(name)) {
                if (name.toLowerCase().trim().includes(line)) {
                    result.push(name)
                }
            }
        }
        if (result.length <= 0) { query.reply(this.error("Couldn't find any chatsound.")); return null }
        result.sort((a, b) => {
            return 	a.length - b.length || // sort by length, if equal then
                    a.localeCompare(b)     // sort by dictionary order
        })

        return this.bot.pages.add(query, result, async function() {
            let displayCount = this.displayCount || this.bot.pages.displayCount
            let buf = ""
            for (let i = displayCount * (this.page - 1); i < displayCount * this.page; i++) {
                if (!this.data[i]) break
                buf = buf + (i + 1) + `. \`${this.data[i]}\`\n`
            }

            let embed = new Discord.MessageEmbed()
                .setAuthor(query.author.tag, query.author.avatarURL())
                .setTitle(categoryName + ": Search results")
                .setDescription(bot.truncate(buf))
                .setFooter(`Page ${this.page}/${this.lastPage} (${this.data.length} entries)`)

            let result = this.result
            if (!result) result = await query.channel.send(options ? options.content : "", embed)
            else await this.result.edit(embed)

            return result
        }, options ? options.displayCount : null)
    }
}
