const Discord = require("discord.js")
const FeedParser = require("feedparser")
const request = require("request")

module.exports = (category, bot) => {
    bot.checkRSSFeed = feed => {
        let req = request(feed.url)
        let feedparser = new FeedParser()

        req.on("response", res => {
            if (res.statusCode !== 200) {
                req.emit("error", new Error("Bad status code"))
            }
            else {
                req.pipe(feedparser)
            }
        })
        req.on("error", err => {
            bot.logger.error("rss-feeds", err.stack || err)
            if (err.code === "ENOTFOUND") {
                feed.destroy().then(() => {
                    let channel = bot.client.channels.get(feed.channel)
                    channel.error(`Feed with URL \`${feed.url}\` could not be checked. It has been removed.\nError: \`${err.code}\``, category.printName)
                })
            }
        })

        feedparser.on("readable", () => {
            let meta = feedparser.meta

            while (item = feedparser.read()) {
                if (item.pubdate.getTime() > feed.lastFeedDate.getTime()) {
                    let embed = new Discord.MessageEmbed()
                    if (item.author) embed.setAuthor(item.author)
                    else if (item["a10:author"]) embed.setAuthor(item["a10:author"]["a10:name"]["#"]) // gay
                    if (item.title) embed.setTitle(item.title)
                    if (item.link) embed.setURL(item.link)
                    if (item.description) embed.setDescription(item.description)
                    if (meta.description || meta.title) embed.setFooter(meta.description || meta.title, meta.favicon)
                    if (meta.image && meta.image.url) embed.setThumbnail(meta.image.url)
                    embed.setTimestamp(item.pubdate)

                    let channel = bot.client.channels.get(feed.channel)
                    channel.send(embed)

                    feed.lastFeedDate = item.pubdate
                    feed.save()
                } else break
            }
        })
        feedparser.on("error", err => {
            bot.logger.error("rss-feeds", err.stack || err)
            if (err.message === "Not a feed") {
                feed.destroy().then(() => {
                    let channel = bot.client.channels.get(feed.channel)
                    channel.error(`URL \`${feed.url}\` is not a valid RSS feed. It has been removed.`, category.printName)
                })
            }
        })
    }
    bot.checkRSSFeeds = msg => {
        bot.db.RSSFeed.sync().then(() => {
            let promise
            if (msg) {
                promise = bot.db.RSSFeed.findAll({
                    where: {
                        channel: msg.channel.id
                    }
                })
            } else {
                promise = bot.db.RSSFeed.findAll()
            }
            promise.then(feeds => {
                if (feeds.length > 0) {
                    // Promisify this shit so we can send a message after all the work's been done
                    for (let i = 0; i < feeds.length; i++) {
                        bot.checkRSSFeed(feeds[i])
                    }
                } else if (msg) {
                    msg.error("No feeds to check for this channel!", category.printName)
                }
            })
        })
    }

    category.addCommand("feed", (msg, line, action, ...str) => {
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
                        }
                    }).spread((feed, created) => {
                        if (created) {
                            msg.success(`This channel is now listening to \`${url}\`.`, category.printName)

                            bot.checkRSSFeed(feed)
                        } else {
                            msg.error(`This channel is already listening to \`${url}\`!`, category.printName)
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
                            buf += `${i + 1}. \`${feed.url}\`\n`
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
                            let url = feed.url
                            feed.destroy().then(() => {
                                msg.success(`This channel is no longer listening to \`${url}\`.`, category.printName)
                            }).catch(err => {
                                msg.error(err, category.printName)
                            })
                        } else {
                            msg.error("Invalid choice. Use `list` to see all feeds and their ID for this channel.", category.printName)
                        }
                    })
                })
                break
            case "check":
                bot.checkRSSFeeds(msg)
                break
            default:
                msg.error("Invalid action.", category.printName)
                break
        }
    }, {
        help: "Perform actions related to RSS feeds.\nAvailable actions are `add, remove, list, check`.",
        permissions: {
            user: [ "MANAGE_GUILD" ]
        },
        guildOnly: true,
    })

    bot.client.on("ready", () => {
        bot.checkRSSFeeds()

        bot.rssInterval = bot.client.setInterval(bot.checkRSSFeeds, 60 * 5 * 1000)
    })
}
