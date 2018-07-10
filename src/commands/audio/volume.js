module.exports = (category, bot) => {
    category.addCommand("volume", (msg, line, vol) => {
        let vc = msg.guild.me.voiceChannel

        if (vc && vc.connection && vc.connection.dispatcher) {
            let volume = Math.min(1, Math.max(0, vol))
            let playing = vc.connection.dispatcher

            if (!vol) {
                msg.result("Volume: " + playing.volume * 100 + "%.")
            } else {
                playing.setVolume(volume)
                msg.success("Changed playing chatsound's volume to " + playing.volume * 100 + "%.")
            }
        } else {
            msg.error("I am not in any channel.")
        }
    }, {
        aliases: [ "vol" ],
        guildOnly: true,
        help: "Changes the volume of the chatsound that's currently playing.\n\nVolume can be between 0 and 1."
    })
}