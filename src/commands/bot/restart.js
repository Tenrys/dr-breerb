const Command = require("@commands/Command.js")

const fs = require("fs")

module.exports = class RestartCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Makes me restart."
        this.ownerOnly = true
    }

    async callback(msg, line) {
        let restartMsg = await msg.reply(this.result("Restarting..."))

        fs.writeFileSync("restart_info.json", JSON.stringify({
            type: "restarted",
            channel: restartMsg.channel.id,
            message: restartMsg.id
        }))
        process.exit() // Restarting is handled by start.sh
    }
}
