const Command = require("@commands/Command.js")

const util = require("util")

module.exports = class SQLCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Executes a raw SQL query on the SQLite database."
        this.ownerOnly = true
    }

    callback(msg, line) {
        let code = /^```\w*\n([\s\S]*)```$/gim.exec(line) // Test if we put a language after the code block first
        if (code && code[1]) line = code[1]
        else {
            code = /^```([\s\S]*)```$/gim.exec(line) // If not then treat everything inside as code
            if (code && code[1]) line = code[1]
        }

        this.bot.db.sequelize.query(line).spread(results => {
            if (typeof results !== "string") results = util.inspect(results)
            msg.reply(this.success("```js\n" + results + "\n```", "SQL result"))
        }).catch(err => {
            msg.reply(this.error("```\n" + err + "\n```", "SQL error"))
        })
    }
}
