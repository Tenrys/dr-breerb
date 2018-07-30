const Command = require("@commands/Command.js")

const { runCommand } = require("@utils")

const util = require("util")

module.exports = class EvaluateCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Executes JavaScript code and displays its result."
        this.ownerOnly = true
    }

    callback(msg, line) {
        let bot = this.bot

        let code = /^```\w*\n([\s\S]*)```$/gim.exec(line) // Test if we put a language after the code block first
        if (code && code[1]) line = code[1]
        else {
            code = /^```([\s\S]*)```$/gim.exec(line) // If not then treat everything inside as code
            if (code && code[1]) line = code[1]
        }

        let res
        try {
            let print = msg.print
            res = eval(line)

            if (typeof res !== "string") res = util.inspect(res)

            msg.reply(this.success(`\`\`\`js\n${bot.truncate(res)}\n\`\`\``, "JavaScript result", bot.colors.yellow))
        } catch (err) {
            res = this.bot.errorToMarkdown(err)

            msg.reply(this.error(`${bot.truncate(res)}`, "JavaScript error"))
        }
    }
}
