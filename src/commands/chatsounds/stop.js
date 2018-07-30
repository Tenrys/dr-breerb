const Command = require("@commands/Command.js")

module.exports = class StopCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Stops anything playing."
        this.aliases = [ "sh" ]
        this.guildOnly = true
    }

    callback(msg) {
        let vc = msg.guild.me.voiceChannel
        if (vc && vc.connection && vc.connection.dispatcher) vc.connection.dispatcher.end()
    }
}
