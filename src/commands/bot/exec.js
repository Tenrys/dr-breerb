const Command = require("../Command.js")

const { runCommand } = require("utils.js")

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
