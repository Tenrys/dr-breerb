const Discord = require("discord.js")

Object.defineProperty(Discord.GuildMember.prototype, "voiceChannel", {
    get() {
        return this.voice ? this.voice.channel : null
    }
})

module.exports = Discord
