const Command = require("@commands/Command.js")

module.exports = class LeaveCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Makes me leave the voice channel I am in."
        this.guildOnly = true
    }

    callback(msg, line) {
        let vc = msg.guild.me.voiceChannel

        if (vc) vc.leave()
        else msg.reply(this.error("I am not in any channel."))
    }
}
