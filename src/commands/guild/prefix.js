const Command = require("@commands/Command.js")

module.exports = class PrefixCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Changes the prefix I listen for on this server. Max length is 5 characters."
        this.guildOnly = true
        this.permissions = {
            user: [ "MANAGE_GUILD" ]
        }
    }

    async callback(msg, line, prefix) {
        await this.bot.db.GuildSettings.sync()

        if (!prefix || prefix === "") {
            let embed = this.result("Here is the prefix I will listen for on this server.")
            await this.bot.db.GuildSettings.findOrCreate({
                where: {
                    guild: msg.guild.id,
                }
            }).spread(settings => {
                embed.addField("Prefix", "```'" + settings.prefix + "'```")
            })
            msg.reply(embed)
        } else if (prefix.length <= 5 && prefix.length > 0) {
            await this.bot.db.GuildSettings.findOrCreate({
                where: {
                    guild: msg.guild.id
                }
            }).spread(settings => {
                settings.prefix = prefix
                settings.save()
            })
            msg.reply(this.success("Prefix changed to ```'" + prefix + "'```"))
        } else {
            msg.reply(this.error("The new prefix cannot be over 5 characters!"))
        }
    }
}
