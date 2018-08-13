const Command = require("@commands/Command.js")

const { runCommandInChannel } = require("@utils")

module.exports = class ExecuteCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Executes a command from the shell."
        this.ownerOnly = true
    }

    async callback(msg, line) {
        let progressMsg = await msg.reply(this.result("Running..."))

        let result = await runCommandInChannel(line, progressMsg, msg)

        await progressMsg.edit("<@" + msg.author.id + ">, " + this.bot.inspectCodeBlock(result), this.success("Done. See results for more information."))
    }
}
