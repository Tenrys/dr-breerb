const Command = require("@commands/Command.js")

const util = require("util")

module.exports = class EvaluateCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Executes JavaScript code and displays its result."
        this.ownerOnly = true
    }

    callback(msg, line) {
        let code = /^```\w*\n([\s\S]*)```$/gim.exec(line) // Test if we put a language after the code block first
        if (code && code[1]) line = code[1]
        else {
            code = /^```([\s\S]*)```$/gim.exec(line) // If not then treat everything inside as code
            if (code && code[1]) line = code[1]
        }

        let results
        try {
            let bot = this.bot
            let print = msg.print
            results = eval(line)

            if (typeof results !== "string") results = util.inspect(results, { depth: 1 })
            results = results.replace(this.bot.client.token, "[REDACTED]")

            msg.reply(this.success("```js\n" + this.bot.truncate(results) + "\n```", "JavaScript result", this.bot.colors.yellow))
        } catch (err) {
            results = this.bot.errorToMarkdown(err)

            msg.reply(this.error(this.bot.truncate(results), "JavaScript error"))
        }
    }
}
