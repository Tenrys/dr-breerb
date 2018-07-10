module.exports = (category, bot) => {
    category.addCommand("join", async function(msg, line, ...args) {
        if (!msg.member) { msg.reply("webhooks unsupported."); return }

        let vc = msg.guild.me.voiceChannel

        if (!vc) {
            vc = msg.member.voiceChannel

            if (vc) {
                await vc.join()

                let guild = msg.guild
                let chan = msg.channel
                vc.emptyTimeout = msg.client.setInterval(function() {
                    let vc = guild.me.voiceChannel

                    if (vc && vc.members && (vc.members.filter(member => !member.user.bot).array().length) < 1) {
                        vc.leave()
                        if (chan) {
                            chan.send(`Left voice channel \`${vc.name}\` due to inactivity.`)
                        }
                        clearInterval(this)
                    } else if (!vc) {
                        clearInterval(this)
                    }
                }, 60 * 3 * 1000)
            } else {
                msg.reply("you aren't in any channel.")
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

    category.addCommand("leave", function(msg, line) {
        let vc = msg.guild.me.voiceChannel

        if (vc) {
            vc.leave()
        } else {
            msg.reply("I am not in any channel.")
        }
    }, {
        guildOnly: true,
        help: "Makes the bot leave the voice channel it's in."
    })
}
