const Discord = require("discord.js")
const sequelize = require("sequelize")

module.exports = (category, bot) => {
    category.addCommand("feed", function(msg, line, action, ...str) {
        action = action.toLowerCase()

		let embed = new Discord.MessageEmbed()

        switch (action) {
            case "add":
                let url = str[0]

                bot.db.RSSFeed.sync().then(() => {
                    bot.db.RSSFeed.findOrCreate({
                        where: {
                            url
                        },
                        defaults: {
                            server: msg.guild.id,
                            channel: msg.channel.id,
                            lastFeedDate: new Date()
                        }
                    })
                    .spread((feed, created) => {
                        if (created) {
                            embed
                                .setColor(bot.colors.green)
                                .setDescription(`created feed with URL \`${url}\` successfully.`)
                        } else {
                            embed
                                .setColor(bot.colors.red)
                                .setDescription(`feed with URL \`${url}\` already exists.`)
                        }

                        msg.reply(embed)
                    })
                })
                break;
            default:
                msg.reply("invalid action.")
                break;
        }
    }, {
        help: "Perform actions related to RSS feeds.",
        permissions: {
            user: [ "MANAGE_GUILD" ]
        },
        guildOnly: true,
    })
}
