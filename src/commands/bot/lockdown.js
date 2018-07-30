const Command = require("@commands/Command.js")

module.exports = class LockdownCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Toggle the bot's reactivity towards anyone other than its owner."
        this.ownerOnly = true

        bot.client.on("ready", () => {
            bot.ownerOnly = !bot.client.user.bot // Only allow owner to use the bot if the bot is a user, otherwise allow everyone
        })
    }

    callback(msg) {
        this.bot.ownerOnly = !this.bot.ownerOnly
        msg.reply(this.success(`Toggled lockdown ${this.bot.ownerOnly ? 'on' : 'off'}.`))
    }
}
