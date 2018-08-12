const Discord = require("discord.js")

Object.defineProperty(Discord.GuildMember.prototype, "voiceChannel", {
    get() {
        return this.voice ? this.voice.channel : null
    }
})

Object.defineProperty(Discord.VoiceChannel.prototype, "members", {
    get() {
        return new Discord.Collection(this.guild.voiceStates
            .filter(state => state.channelID === this.id && state.member)
            .map(state => [state.id, state.member]))
    }
})

module.exports = Discord
