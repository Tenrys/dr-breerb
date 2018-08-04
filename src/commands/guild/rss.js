const Command = require("@commands/Command.js")

const Discord = require("discord.js")

const request = require("request")
const FeedParser = require("feedparser")

const Entities = require("html-entities").AllHtmlEntities
const entities = new Entities()

const Turndown = require("turndown")
const turndown = new Turndown()
turndown.remove("img")

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

module.exports = class RSSCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Setup RSS feeds.\nAvailable actions are `add, remove, list, check`."
        this.guildOnly = true
        this.permissions = {
            user: [ "MANAGE_GUILD" ]
        }

        bot.rssFeeds = {
            get: async (channel, id) => {
                await bot.db.RSSFeed.sync()

                let where = {}
                if (channel) {
                    where.guild = channel.guild.id
                    where.channel = channel.id
                }
                let feeds = await bot.db.RSSFeed.findAll({ where })
                return (id !== null && id !== undefined) ? feeds[id] : feeds
            },
            check: async (channel, id) => {
                await bot.db.RSSFeed.sync()

                let where = {}
                if (channel) {
                    where.guild = channel.guild.id
                    where.channel = channel.id
                }
                if (id) where.id = id
                let feeds = await bot.db.RSSFeed.findAll({ where })

                let checks = []
                if (feeds.length > 0) {
                    for (let i = 0; i < feeds.length; i++) {
                        let feed = feeds[i]
                        checks.push(new Promise(async (resolve, reject) => {
                            let req
                            try {
                                req = request(feed.url)
                            } catch (err) {
                                bot.logger.error("rss-feeds", err.stack || err)
                                if (err.message.match(/Invalid URI "(.*)"/gi)) {
                                    await feed.destroy()
                                    reject(feed, "Invalid URL `" + feed.url + "`.")
                                }
                            }
                            if (!req) return

                            let feedparser = new FeedParser()

                            req.on("response", res => {
                                if (res.statusCode != 200) req.emit("error", new Error("Bad status code"))
                                else req.pipe(feedparser)
                            })
                            req.on("error", async err => {
                                bot.logger.error("rss-feeds", err.stack || err)
                                if (err.code === "ENOTFOUND") {
                                    await feed.destroy()
                                    reject(feed, "Feed with URL `" + feed.url + "` could not be checked. It has been removed.\nError: `" + err.code + "`")
                                }
                            })

                            feedparser.on("readable", () => {
                                let meta = feedparser.meta
                                if (!(feedparser.meta && feedparser.meta["#type"])) return
                                let item

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
                                        feed.valid = true
                                        feed.save()
                                    } else break
                                }
                                resolve(feed)
                            })
                            feedparser.on("error", async err => {
                                bot.logger.error("rss-feeds", err.stack || err)
                                if (err.message === "Not a feed" && !feed.valid) {
                                    await feed.destroy()
                                    reject(feed, "URL `" + feed.url + "` is not a valid RSS feed.")
                                }
                            })
                        }))
                    }
                }
                return checks
            },
            checkAll: async channel => {
                let promises = await bot.rssFeeds.check(channel)
                promises.forEach(promise => {
                    promise.catch((_feed, err) => {
                        bot.logger.warn("Feed errored: " + _feed.url + ", " + err)
                        bot.client.channels.get(_feed.channel).send(this.error(err))
                    })
                })
            }
        }

        bot.client.on("ready", () => {
            bot.rssFeeds.checkAll()
            bot.rssInterval = bot.client.setInterval(bot.rssFeeds.checkAll, 60 * 5 * 1000)
        })
    }

    async callback(msg, line, action, ...str) {
        action = (action || "").toLowerCase()

        switch (action) {
            case "add":
                let url = str[0].trim()
                if (!/^https?:\/\//i.test(url)) { msg.reply(this.error(`URL needs to begin with \`http://\` or \`https://\`.`)); return }

                await this.bot.db.RSSFeed.sync()

                this.bot.db.RSSFeed.findOrCreate({
                    where: {
                        guild: msg.guild.id,
                        channel: msg.channel.id,
                        url
                    }
                }).spread(async (feed, created) => {
                    if (created) {
                        let promises = await this.bot.rssFeeds.check(this.bot.client.channels.get(feed.channel))
                        promises.forEach(promise => {
                            promise.then(_feed => {
                                if (_feed.url == url) {
                                    msg.reply(this.success(`This channel is now listening to \`${url}\`.`))
                                }
                            }).catch((_feed, err) => {
                                if (_feed.url == url) {
                                    msg.reply(this.error(err))
                                }
                            })
                        })
                    } else {
                        msg.reply(this.error(`This channel is already listening to \`${url}\`!`))
                    }
                })
                break
            case "list":
                let feeds = await this.bot.rssFeeds.get(msg.channel)
                let buf = ""
                for (let i = 0; i < feeds.length; i++) {
                    let feed = feeds[i]
                    buf += `${i + 1}. \`${feed.url}\`\n`
                }
                msg.reply(this.result(buf || "None for this channel."))
                break
            case "remove":
                let choice = parseInt(str[0], 10)
                if (isNaN(choice)) { msg.reply(this.error("Invalid choice.")); return }
                choice = Math.max(0, choice - 1)

                await this.bot.db.RSSFeed.sync()

                let feed = await this.bot.rssFeeds.get(msg.channel, choice)
                if (feed) {
                    await feed.destroy()
                    msg.reply(this.success(`This channel is no longer listening to \`${feed.url}\`.`))
                } else {
                    msg.reply(this.error("Invalid choice. Use `list` to see all feeds and their ID for this channel."))
                }
                break
            case "check":
                await this.bot.rssFeeds.checkAll(msg.channel)
                msg.channel.send(this.success("Checked all RSS feeds for this channel."))
                break
            default:
                msg.reply(this.error("Invalid action."))
                break
        }
    }
}
