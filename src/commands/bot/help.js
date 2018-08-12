const Command = require("@commands/Command.js")

const Discord = require("@extensions/discord.js")

module.exports = class HelpCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Displays information about commands and their categories."
    }

    callback(msg, line) {
        line = line.toLowerCase()

        let embed = new Discord.MessageEmbed()
            .setColor(this.bot.colors.blue)
            // .setAuthor(msg.author.tag, msg.author.avatarURL())

        let result = this.bot.commands.get(line)
        if (result instanceof Command) {
            embed.setTitle(":information_source: Command help: `" + result.name + "`")
            embed.setDescription(result.description)
        } else {
            embed.setTitle(":tools: Command list")
            let showAll = line === "all"
            if (!showAll) {
                embed.setDescription("If you want to see all commands at once, run the same command again with argument `all`.")
            }

            let categories = {} // meh
            for (const _ in this.bot.commands) {
                if (this.bot.commands.hasOwnProperty(_)) {
                    const cmd = this.bot.commands[_]
                    if (cmd instanceof Command) {
                        if (cmd.guildOnly && !msg.guild) continue
                        if (cmd.ownerOnly && !this.bot.ownerId.includes(msg.author.id)) continue
                        let cont = true
                        if (cmd.permissions) {
                            if (cmd.permissions.bot) {
                                for (const permission of cmd.permissions.bot) {
                                    if (!msg.guild.me.hasPermission(permission)) {
                                        cont = false
                                        break
                                    }
                                }
                            }
                            if (cont && cmd.permissions.user) {
                                for (const permission of cmd.permissions.user) {
                                    if (!msg.member.hasPermission(permission)) {
                                        cont = false
                                        break
                                    }
                                }
                            }
                        }
                        if (!cont) continue

                        let category = showAll ? "commands" : cmd.category
                        categories[category] = categories[category] || []
                        categories[category].push("`" + cmd.name + "`")
                        for (const alias of cmd.aliases) {
                            categories[category].push("`" + alias + "`")
                        }
                    }
                }
            }

            for (const name in categories) {
                if (categories.hasOwnProperty(name)) {
                    const category = categories[name]
                    embed.addField(Command.categoryNames[name], category.join(", "))
                }
            }
        }

        msg.reply(embed)
    }
}

