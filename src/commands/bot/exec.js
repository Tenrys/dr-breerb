const Command = require("@commands/Command.js")

const { runCommand } = require("@utils")

module.exports = class ExecuteCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Executes a command from the shell."
        this.ownerOnly = true
    }

    async callback(msg, line) {
        msg.print(await runCommand(line))
    }
}
