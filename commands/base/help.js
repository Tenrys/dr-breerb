const Discord = require("discord.js")
const { Command, CommandCategory } = require("../../commands.js")

module.exports = (category, bot) => {
   category.addCommand("help", function(msg, line) {
        line = line.toLowerCase()
        let res = bot.commands.get(line)

        let embed = new Discord.MessageEmbed()
            .setColor(0x5ABEBC)
            .setAuthor(msg.author.tag, msg.author.avatarURL())

        if (res instanceof Command) {
            embed.setTitle(`:information_source: Command help: \`${res.name}\``)
                .setDescription(res.help)
        } else if (res instanceof CommandCategory) {
            let showAll = line === "all"
            embed.setTitle(":tools: Command list")
            if (!showAll) {
                embed.setDescription("If you want to see all commands at once, run the same command again with the `all` argument.")
            }

            forin(bot.commands, (_, cat) => {
                if (cat instanceof CommandCategory) {
                    if ((showAll && cat.name === "all") || (!showAll && cat.name !== "all")) {
                        embed.addField(cat.printName, cat.description + "\n" + "```" + cat.commands.map(cmd => cmd.name).join(", ") + "```")
                    }
                }
            })
        }

        msg.channel.send(embed)
    }, { help: "Displays information about commands and their categories." })
}
