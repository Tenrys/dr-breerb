const Command = require("@commands/Command.js")

module.exports = class SnipeCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Check the last 3 deleted messages in a channel."
        this.guildOnly = true

        bot.client.on("messageDelete", (msg) => {
            if (msg.author.bot) return
            if (!msg.channel.lastDeletes) msg.channel.lastDeletes = []

            msg.channel.lastDeletes.unshift(msg)
            if (msg.channel.lastDeletes.length > 3) msg.channel.lastDeletes.pop()
        })
    }

    async callback(msg) {
        if (msg.channel.lastDeletes && msg.channel.lastDeletes.length > 0) {
            msg.reply(this.success(
                msg.channel.lastDeletes.map((msg, k) =>
                    `${k + 1}. \`${msg.content}\` - **${msg.author.tag}** (${msg.author.id})`
                ).join("\n"), ":wastebasket: Last deleted messages in this channel")
            )
        } else {
            msg.reply(this.error("Haven't noticed any message being deleted here yet."))
        }
    }
}
