const Command = require("@commands/Command.js")

module.exports = class VolumeCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Changes the volume of the chatsound that's currently playing.\n\nVolume can be between 0 and 1."
        this.aliases = [ "vol" ]
        this.guildOnly = true
    }

    callback(msg, vol) {
        let guild = msg.guild

        if (vol > 1 && vol <= 100) vol = vol / 100
        let volume = Math.min(1, Math.max(0, vol))

        if (!vol || isNaN(vol) || isNaN(volume)) msg.reply(this.result("Volume: " + (guild.volume || 0.66) * 100 + "%."))
        else {
            guild.volume = volume
            let vc = guild.me.voiceChannel
            if (vc && vc.connection && vc.connection.dispatcher) vc.connection.dispatcher.setVolume(guild.volume)
            msg.reply(this.success("Changed volume to " + guild.volume * 100 + "%."))
        }
    }
}
