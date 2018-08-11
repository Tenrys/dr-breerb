const Command = require("@commands/Command.js")

module.exports = class JoinCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Makes me join the voice channel you are currently in."
        this.guildOnly = true
    }

    callback(msg) {
        let vc = msg.guild.me.voiceChannel

        if (vc !== msg.member.voiceChannel || !msg.member.voiceChannel) {
            if (msg.member.voiceChannel) {
                vc = msg.member.voiceChannel
                vc.join()

                let guild = msg.guild
                let channel = msg.channel
                guild.emptyLeaveTimeout = this.bot.client.setInterval(() => {
                    let vc = guild.me.voiceChannel

                    if (vc && vc.members && (vc.members.filter(member => !member.user.bot).array().length) < 1) {
                        vc.leave()
                        if (channel) channel.send(this.result("Left voice channel `" + vc.name + "` due to inactivity."))
                        clearInterval(guild.emptyLeaveTimeout)
                    } else if (!vc) clearInterval(guild.emptyLeaveTimeout)
                }, 60 * 3 * 1000)
            } else { msg.reply(this.error("You aren't in any channel.")); return null }
        }

        return vc
    }
}
