const Discord = require("discord.js")
const FeedParser = require("feedparser")
const request = require("request")
const Entities = require("html-entities").AllHtmlEntities
const entities = new Entities()

module.exports = (category, bot) => {
    let title = ":loudspeaker: RSS feeds"

    function hashCode(str) {
        var hash = 0
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return hash
    }
    function intToHexRGB(i){
        var c = (i & 0x00FFFFFF).toString(16).toUpperCase()
        return "00000".substring(0, 6 - c.length) + c
    }

    bot.checkRSSFeed = feed => {
        return new Promise((resolve, reject) => {
            let req
            try {
                req = request(feed.url)
            } catch (err) {
                bot.logger.error("rss-feeds", err.stack || err)
                if (err.message.match(/Invalid URI "(.*)"/gi)) {
                    feed.destroy().then(() => {
                        reject("Invalid URL `" + feed.url + "`.")
                    })
                }
            }
            if (!req) return
            let feedparser = new FeedParser()

            req.on("response", res => {
                if (res.statusCode !== 200) req.emit("error", new Error("Bad status code"))
                else req.pipe(feedparser)
            })
            req.on("error", err => {
                bot.logger.error("rss-feeds", err.stack || err)
                if (err.code === "ENOTFOUND") {
                    feed.destroy().then(() => {
                        reject("Feed with URL `" + feed.url + "` could not be checked. It has been removed.\nError: `" + err.code + "`")
                    })
                }
            })

            feedparser.on("readable", () => {
                let meta = feedparser.meta
                if (!(feedparser.meta && feedparser.meta["#type"])) return

                while (item = feedparser.read()) {
                    if (item.pubdate.getTime() > feed.lastFeedDate.getTime()) {
                        let embed = new Discord.MessageEmbed()
                        let author
                        if (item.author) author = item.author
                        else if (item["a10:author"]) author = item["a10:author"]["a10:name"]["#"] // gay
                        else if (item["dc:creator"]) author = item["dc:creator"] // gay
                        if (author) {
                            embed.setAuthor(author)
                            embed.setColor(parseInt("0x" + intToHexRGB(hashCode(author)), 16))
                        }
                        if (item.title) embed.setTitle(item.title)
                        if (item.link) embed.setURL(item.link)
                        if (item.description) {
                            let description = item.description
                            description = entities.decode(description)
                            description = description.replace(/(<([^>]+)>)/ig, "")
                            description = bot.truncate(description)
                            embed.setDescription(description)
                        }
                        if (meta.description || meta.title) embed.setFooter(meta.description || meta.title, meta.favicon)
                        if (meta.image && meta.image.url) embed.setThumbnail(meta.image.url)
                        embed.setTimestamp(item.pubdate)

                        let channel = bot.client.channels.get(feed.channel)
                        channel.send(embed)

                        feed.lastFeedDate = item.pubdate
                        feed.save()
                    } else break
                }
                resolve()
            })
            feedparser.on("error", err => {
                bot.logger.error("rss-feeds", err.stack || err)
                if (err.message === "Not a feed") {
                    feed.destroy().then(() => {
                        reject("URL `" + feed.url + "` is not a valid RSS feed.")
                    })
                }
            })
        })
    }
    bot.checkRSSFeeds = destination => {
        bot.db.RSSFeed.sync().then(() => {
            let options
            if (destination) {
                options = {
                    where: {
                        channel: destination instanceof Discord.Message ? destination.channel.id : destination.id
                    }
                }
            }
            bot.db.RSSFeed.findAll(options).then(async feeds => {
                if (feeds.length > 0) {
                    for (let i = 0; i < feeds.length; i++) {
                        await bot.checkRSSFeed(feeds[i])
                    }
                    if (destination) destination.success("Checked all RSS feeds for this channel.", title)
                } else if (chan) {
                    destination.error("No feeds to check for this channel!", title)
                }
            })
        })
    }

    category.addCommand("rss", (msg, line, action, ...str) => {
        action = (action || "").toLowerCase()

        switch (action) {
            case "add":
                let url = str[0].trim()
                if (!/^https?:\/\//i.test(url)) {
                    msg.error(`URL needs to begin with \`http://\` or \`https://\`.`, title)
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
                            bot.checkRSSFeed(feed).then(() => {
                                msg.success(`This channel is now listening to \`${url}\`.`, title)
                            }).catch(err => {
                                msg.error(err, title)
                            })
                        } else {
                            msg.error(`This channel is already listening to \`${url}\`!`, title)
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
                        msg.result(buf || "None for this channel.", title)
                    })
                })
                break
            case "remove":
                let choice = parseInt(str[0], 10)
                if (isNaN(choice)) {
                    msg.error("Invalid choice.", title)
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
                                msg.success(`This channel is no longer listening to \`${url}\`.`, title)
                            }).catch(err => {
                                msg.error(err, title)
                            })
                        } else {
                            msg.error("Invalid choice. Use `list` to see all feeds and their ID for this channel.", title)
                        }
                    })
                })
                break
            case "check":
                bot.checkRSSFeeds(msg)
                break
            default:
                msg.error("Invalid action.", title)
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
