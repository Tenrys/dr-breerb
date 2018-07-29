module.exports = (category, bot) => {
    category.addCommand("volume", (msg, line, vol) => {
        let vc = msg.guild.me.voiceChannel

        if (vc && vc.connection && vc.connection.dispatcher) {
            if (vol > 1 && vol <= 100) vol = vol / 100
            let volume = Math.min(1, Math.max(0, vol))

            let playing = vc.connection.dispatcher
            if (vol === undefined || vol === null || isNaN(vol) || isNaN(volume)) msg.result("Volume: " + playing.volume * 100 + "%.")
            else {
                vc.guild.volume = volume
                playing.setVolume(vc.guild.volume)
                msg.success("Changed volume to " + vc.guild.volume * 100 + "%.", category.printName)
            }
        } else {
            msg.error("I am not in any channel.", category.printName)
        }
    }, {
        aliases: [ "vol" ],
        guildOnly: true,
        help: "Changes the volume of the chatsound that's currently playing.\n\nVolume can be between 0 and 1."
    })
}
