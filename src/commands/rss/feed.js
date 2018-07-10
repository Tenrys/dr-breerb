const Discord = require("discord.js")
// const sequelize = require("sequelize")

module.exports = (category, bot) => {
    category.addCommand("feed", function(msg, line, action, ...str) {
        action = (action || "").toLowerCase()

        switch (action) {
            case "add":
                let url = str[0].trim()
                if (!/^https?:\/\//i.test(url)) {
                    msg.error(`URL needs to begin with \`http://\` or \`https://\`.`, category.printName)
                    return
                }

                bot.db.RSSFeed.sync().then(() => {
                    bot.db.RSSFeed.findOrCreate({
                        where: {
                            url,
                            server: msg.guild.id,
                            channel: msg.channel.id
                        },
                        defaults: {
                            lastFeedDate: new Date()
                        }
                    }).spread((feed, created) => {
                        if (created) {
                            msg.success(`This channel is now listening to the RSS feed with URL \`${url}\`.`, category.printName)
                        } else {
                            msg.error(`This channel is already listening to the RSS feed with URL \`${url}\`!`, category.printName)
                        }
                    })
                })
                break
            case "list":
                bot.db.RSSFeed.sync().then(() => {
                    bot.db.RSSFeed.findAll({
                        where: {
                            server: msg.guild.id,
                            channel: msg.channel.id
                        }
                    }).then(feeds => {
                        let buf = ""
                        for (let i = 0; i < feeds.length; i++) {
                            let feed = feeds[i]
                            buf += `${i + 1}. \`${feed.get("url")}\`\n`
                        }
                        msg.result(buf || "None for this channel.", category.printName)
                    })
                })
                break
            case "remove":
                let choice = parseInt(str[0], 10)
                if (isNaN(choice)) {
                    msg.error("Invalid choice.", category.printName)
                    return
                }
                choice = Math.max(0, choice - 1)
                bot.db.RSSFeed.sync().then(() => {
                    bot.db.RSSFeed.findAll({
                        where: {
                            server: msg.guild.id,
                            channel: msg.channel.id
                        }
                    }).then(feeds => {
                        let feed = feeds[choice]
                        if (feed) {
                            let url = feed.get("url")
                            feed.destroy().then(() => {
                                msg.success(`This channel is no longer listening to feed with URL \`${url}\`.`, category.printName)
                            }).catch((err) => {
                                msg.error(err, category.printName)
                            })
                        } else {
                            msg.error("Invalid choice.", category.printName)
                        }
                    })
                })
                break
            default:
                msg.error("Invalid action. Possible actions are `add, remove, list`.", category.printName)
                break
        }
    }, {
        help: "Perform actions related to RSS feeds.",
        permissions: {
            user: [ "MANAGE_GUILD" ]
        },
        guildOnly: true,
    })
}
