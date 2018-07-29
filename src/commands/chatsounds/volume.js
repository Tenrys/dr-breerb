module.exports = (category, bot) => {
    category.addCommand("volume", (msg, line, vol) => {
        let guild = msg.guild

        if (vol > 1 && vol <= 100) vol = vol / 100
        let volume = Math.min(1, Math.max(0, vol))

        if (vol === undefined || vol === null || isNaN(vol) || isNaN(volume)) msg.result("Volume: " + (guild.volume || 0.66) * 100 + "%.")
        else {
            guild.volume = volume
            if (vc = guild.me.voiceChannel && vc.connection && vc.connection.dispatcher) vc.connection.dispatcher.setVolume(guild.volume)
            msg.success("Changed volume to " + guild.volume * 100 + "%.", category.printName)
        }
    }, {
        aliases: [ "vol" ],
        guildOnly: true,
        help: "Changes the volume of the chatsound that's currently playing.\n\nVolume can be between 0 and 1."
    })
}
