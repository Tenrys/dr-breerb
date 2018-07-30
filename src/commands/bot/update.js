const Command = require("@commands/Command.js")

const { runCommand } = require("@utils")

const fs = require("fs")

module.exports = class UpdateCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Updates the bot to the latest revision from its GitHub repository and quits it."
        this.ownerOnly = true
    }

    async callback(msg, line) {
        let progressMsg = await msg.reply(this.result("Updating...\n"))

        let result = await runCommand("git pull")

        await progressMsg.edit(`<@${msg.author.id}>, \`\`\`${this.bot.truncate(result)}\`\`\``, this.success("Done. See results for more information."))

        if (result.match("Updating") && !result.match("Aborting")) {
            progressMsg = await progressMsg.channel.messages.fetch(progressMsg.id) // Hack to make sure we have the right content, idk if this works
            await progressMsg.edit(progressMsg.content, this.result("Restarting..."))

            fs.writeFileSync("restart_info.json", JSON.stringify({ channel: progressMsg.channel.id, message: progressMsg.id }))
            process.exit() // Restarting is handled by start.sh
        }
    }
}
