module.exports = (category, bot) => {
    category.addCommand("join", async (msg, line, ...args) => {
        if (!msg.member) { msg.error("Webhooks are unsupported.", category.printName); return }

        let vc = msg.guild.me.voiceChannel

        if (!vc) {
            vc = msg.member.voiceChannel

            if (vc) {
                await vc.join()

                let guild = msg.guild
                let channel = msg.channel
                vc.emptyTimeout = msg.client.setInterval(function() {
                    let vc = guild.me.voiceChannel

                    if (vc && vc.members && (vc.members.filter(member => !member.user.bot).array().length) < 1) {
                        vc.leave()
                        if (channel) {
                            channel.result(`Left voice channel \`${vc.name}\` due to inactivity.`, category.printName)
                        }
                        clearInterval(this)
                    } else if (!vc) {
                        clearInterval(this)
                    }
                }, 60 * 3 * 1000)
            } else {
                msg.error("You aren't in any channel.", category.printName)
            }
        } else {
            if (!vc.connection) {
                bot.logger.warn("discord-voice", "No connection? What.")
                await vc.leave()
                await vc.join()
            }
        }

        return vc
    }, {
        guildOnly: true,
        help: "Makes the bot join the voice channel you are currently in."
    })

    category.addCommand("leave", (msg, line) => {
        let vc = msg.guild.me.voiceChannel

        if (vc) {
            vc.leave()
        } else {
            msg.error("I am not in any channel.", category.printName)
        }
    }, {
        guildOnly: true,
        help: "Makes the bot leave the voice channel it's in."
    })
}
