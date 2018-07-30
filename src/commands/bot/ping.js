const Command = require("@commands/Command.js")

module.exports = class PingCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Pings the bot."
    }

    callback(msg) {
        msg.reply("pong!")
    }
}
