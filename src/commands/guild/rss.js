const Discord = require.main.require("./src/extensions/discord.js")

const request = require("request")
const FeedParser = require("feedparser")

const Entities = require("html-entities").AllHtmlEntities
const entities = new Entities()

const Turndown = require("turndown")
const turndown = new Turndown()
turndown.remove("img")

module.exports = (category, bot) => {
    let title = ":loudspeaker: RSS feeds"

    function hashCode(str) {
        var hash = 0
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return hash
    }
    function hashToIntRGB(i) {
        return i & 0x00FFFFFF
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
                if (res.statusCode != 200) req.emit("error", new Error("Bad status code"))
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
                        let author, description, authorAvatar, authorURL

                        if (item.author) author = item.author
                        else if (item["a10:author"]) author = item["a10:author"]["a10:name"]["#"] // gay
                        else if (item["dc:creator"]) author = item["dc:creator"] // gay
                        if (item.image && item.image.url) {
                            if (feedparser.meta["#type"] === "atom") {
                                authorAvatar = item.image.url
                            } else {
                                embed.setThumbnail(item.image.url)
                            }
                        }
                        if (item["atom:author"] && item["atom:author"].uri) authorURL = item["atom:author"].uri["#"] // GAY
                        if (author) {
                            embed.setAuthor(author, authorAvatar, authorURL)
                            embed.setColor(hashToIntRGB(hashCode(author)))
                        }

                        if (item.title) embed.setTitle(item.title)
                        if (item.link) embed.setURL(item.link)

                        if (item.description) {
                            description = item.description
                            description = entities.decode(description) // Decode HTML entities
                            // description = description.replace(/(^[ \t]*\n)/gm, "") // Remove blank lines, unnecessary thanks to turndown
                            description = turndown.turndown(description) // Turn HTML tags into Markdown
                            description = bot.truncate(description) // Truncate so stuff isn't too long
                            if (item.title !== description) embed.setDescription(description)
                        }

                        if (meta.description || meta.title) {
                            let footerIcon = meta.favicon
                            if (!footerIcon && meta.image && meta.image.url) footerIcon = meta.image.url
                            embed.setFooter(meta.description || meta.title, footerIcon)
                        }
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
                    for (let i = 0; i < feeds.length; i++) await bot.checkRSSFeed(feeds[i])
                    if (destination) destination.success("Checked all RSS feeds for this channel.", title)
                } else if (destination) destination.error("No feeds to check for this channel!", title)
            })
        })
    }

    category.addCommand("rss", (msg, line, action, ...str) => {
        action = (action || "").toLowerCase()

        switch (action) {
            case "add":
                let url = str[0].trim()
                if (!/^https?:\/\//i.test(url)) { msg.error(`URL needs to begin with \`http://\` or \`https://\`.`, title); return }

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
                if (isNaN(choice)) { msg.error("Invalid choice.", title); return }
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
