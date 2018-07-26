// TODO: Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically

const Discord = require("./extensions/discord.js")

const fs = require("fs")
const path = require("path")

const repl = require("repl")

module.exports = options => {
    class Bot {
        /**
         * The Discord user ID of the bot's owner.
         */
        get ownerId() { return options.ownerId }

        /**
         * The URL of the project's GitHub repository, determined by the package.json file.
         */
        get repositoryURL() { return JSON.parse(fs.readFileSync("./package.json")).repository + "/tree/master" }

        /**
         * Returns the modified stack trace of an error, stripping the current working directory from file paths and, on Discord, linking to files on the project's GitHub repository at the exact concerned lines.
         * @param {Error} err
         */
        formatErrorToDiscord(err) {
            if (err.stack) {
                let trace = err.stack
                let regex = new RegExp(path.join(process.cwd(), "/").replace(/\\/g, "\\\\") + "(.*\.js):(\\d*):(\\d*)", "gi")
                trace = trace.replace(regex, `[$1\\:$2\\:$3](${this.repositoryURL}/$1#L$2)`)
                return trace
            } else { return err }
        }

        /**
         * Shortens a string to something close to the maximum length Discord accepts for a message.
         * @param {string} str The string to be truncated.
         */
        truncate(str) {
            if (str.length > 1960) {
                return str.substr(0, 1960) + "\n[...] (output truncated)"
            } else {
                return str
            }
        }

        /**
         * @param {string} token The Discord user token to login with
         */
        constructor(options) {
            this.logger = require("./classes/Logger.js")
            if (options.log === false) {
                for (const k in this.logger) {
                    if (this.logger.hasOwnProperty(k)) {
                        const v = this.logger[k]

                        if (typeof v == "function") {
                            this.logger[k] = () => {}
                        }
                    }
                }
            }

            let client = new Discord.Client()
            let bot = this
            client.on("ready", async () => {
                let replServer = repl.start("")
                replServer.context.Discord = Discord
                replServer.context.bot = bot
                replServer.on("exit", () => {
                    process.exit()
                })
                bot.logger.success("repl", "Ready.")

                if (fs.existsSync("restart_info.json")) {
                    try {
                        let restartInfo = require.main.require("./restart_info.json")
                        let channel = bot.client.channels.get(restartInfo.channel)
                        let msg = await channel.messages.fetch(restartInfo.message)
                        await msg.edit(msg.content, Discord.MessageEmbed.success("Restarted.", bot.commands.get("base").printName))
                    } catch (err) {
                        bot.logger.error("restart-info", err)
                    }

                    fs.unlinkSync("restart_info.json")
                }
            })
            client.on("error", ev => {
                bot.logger.error("discord", "Websocket error: " + ev.message)
            })
            client.on("reconnecting", () => {
                bot.logger.warn("discord", "Websocket reconnecting...")
            })
            client.on("resumed", count => {
                bot.logger.log("discord", `Websocket resumed. (${count} events replayed)`)
            })
            client.on("disconnect", ev => {
                bot.logger.error("discord", `Websocket disconnected: ${ev.reason} (code ${ev.code})`)
                login() // Not sure if this works, but try starting the bot again if we get disconnected
            })
            client.on("warn", ev => {
                bot.logger.warn("discord", "Websocket warning: " + ev.message)
            })

            this.client = client
            this.token = options.token
        }

        /**
         * Attempts to login to Discord with the Bot's token
         */
        async login() {
            if (this.client.status === null || this.client.status == 5) {
                this.logger.working("discord", "Logging in...")

                await this.client.login(this.token)
                    .then(() => {
                        this.logger.success("discord", `Logged in as ${this.client.user.tag}.`)

                        if (!this.client.user.bot) {
                            this.logger.warn("discord", "Logged in with non-bot account, unintended (and possibly destructive) behavior is to be expected!")
                        }
                    })
                    .catch(err => {
                        this.logger.error("discord", "Connection error: " + err.message)
                    })
            }
        }
    }

    let bot = new Bot(options)
    bot.colors = require("./colors.js")
    require("./sqlite.js")(bot)
    require("./pages.js")(bot)
    require("./commands.js")(bot)

    return bot
}

