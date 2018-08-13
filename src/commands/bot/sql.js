const Command = require("@commands/Command.js")

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
            msg.reply(this.success(this.bot.inspectCodeBlock(results, true), "SQL result"))
        }).catch(err => {
            msg.reply(this.error(this.bot.inspectCodeBlock(err, true), "SQL error"))
        })
    }
}
