const Command = require("../../classes/Command.js")
const CommandCategory = require("../../classes/CommandCategory.js")

const Discord = require("../../extensions/discord.js")

module.exports = (category, bot) => {
   category.addCommand("help", (msg, line) => {
        line = line.toLowerCase()
        let res = bot.commands.get(line)

        let embed = new Discord.MessageEmbed()
            .setColor(bot.colors.blue)
            // .setAuthor(msg.author.tag, msg.author.avatarURL())

        if (res instanceof Command) {
            embed
                .setTitle(`:information_source: Command help: \`${res.name}\``)
                .setDescription(res.help)
        } else if (res instanceof CommandCategory) {
            let showAll = line === "all"
            embed.setTitle(":tools: Command list")
            if (!showAll) {
                embed.setDescription("If you want to see all commands at once, run the same command again with the `all` argument.")
            }

            for (const _ in bot.commands) {
                if (bot.commands.hasOwnProperty(_)) {
                    let category = bot.commands[_]

                    if (category instanceof CommandCategory && ((showAll && category.name === "all") || (!showAll && category.name !== "all"))) {
                        embed.addField(category.printName, category.description + "\n" + "```" + (category.commands.map(cmd => cmd.name).join(", ") || "none LOL") + "```")
                    }
                }
            }
        }

        msg.reply(embed)
    }, { help: "Displays information about commands and their categories." })
}
