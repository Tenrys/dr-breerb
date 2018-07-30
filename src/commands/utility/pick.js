const Command = require("@commands/Command.js")

module.exports = class PickCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Picks a random argument from the ones you provide."
    }

    callback(msg, line, ...str) {
        if (!str) return
        if (str.length < 1) return

        msg.reply(str.random())
    }
}
