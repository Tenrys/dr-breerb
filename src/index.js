require("@/error_handling.js")()

const Discord = require("discord.js")

const fs = require("fs")
const path = require("path")

const repl = require("repl")

module.exports = class Bot {
    /**
     * The URL of the project's GitHub repository, determined by the package.json file.
     */
    get repositoryURL() { return JSON.parse(fs.readFileSync("./package.json")).repository + "/tree/master" }

    /**
     * Returns the modified stack trace of an error, stripping the current working directory from file paths and, on Discord, linking to files on the project's GitHub repository at the exact concerned lines.
     * @param {Error} err
     */
    errorToMarkdown(err) {
        if (err.stack) {
            let trace = err.stack
            let regex = new RegExp(path.join(process.cwd(), "/").replace(/\\/g, "\\\\") + "(.*\.js):(\\d*):(\\d*)", "gi")
            trace = trace.replace(regex, `[$1\\:$2\\:$3](${this.repositoryURL}/$1#L$2)`)
            return trace
        } else return err
    }

    /**
     * Shortens a string to something close to the maximum length Discord accepts for a message.
     * @param {string} str The string to be truncated.
     */
    truncate(str) {
        if (str.length > 1960) return str.substr(0, 1960) + "\n[...] (output truncated)"
        else return str
    }

    /**
     * @param {string} token The Discord user token to login with
     */
    constructor(options) {
        this.colors = require("@utils").colors

        this.logger = require("@utils/classes/Logger.js")
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

        this.client = new Discord.Client()
        this.client.bot = this
        this.client.on("ready", async () => {
            this.logger.success("discord", `Logged in as ${this.client.user.tag}.`)

            if (!this.client.user.bot) {
                this.logger.warn("discord", "Logged in with non-bot account, unintended (and possibly destructive) behavior is to be expected!")
            }

            this.token = undefined

            let replServer = repl.start("")
            replServer.context.Discord = Discord
            replServer.context.bot = this
            replServer.on("exit", process.exit.bind(process))
            this.logger.success("repl", "Ready.")

            if (fs.existsSync("restart_info.json")) { // Ghetto as heck
                try {
                    let restartInfo = require("../restart_info.json")
                    switch (restartInfo.type) {
                        case "restarted":
                            let channel = this.client.channels.get(restartInfo.channel)
                            let msg = await channel.messages.fetch(restartInfo.message)
                            let update = this.commands.get("update")
                            await msg.edit(msg.content, update.success("Restarted."))
                            break
                        case "unhandled_exception":
                            for (const userId of this.ownerId) {
                                this.client.users.get(userId).send("```\n" + restartInfo.error + "```")
                            }
                            break
                    }

                } catch (err) {
                    this.logger.error("restart-info", err)
                }

                fs.unlinkSync("restart_info.json")
            }
        })
        this.client.on("error", ev => {
            this.logger.error("discord", "Websocket error: " + ev.message)
        })
        this.client.on("reconnecting", () => {
            this.logger.warn("discord", "Websocket reconnecting...")
        })
        this.client.on("resumed", count => {
            this.logger.log("discord", `Websocket resumed. (${count} events replayed)`)
        })
        this.client.on("disconnect", ev => {
            this.logger.error("discord", `Websocket disconnected: ${ev.reason} (code ${ev.code})`)
            login() // Not sure if this works, but try starting the bot again if we get disconnected
        })
        this.client.on("warn", ev => {
            this.logger.warn("discord", "Websocket warning: " + ev.message)
        })

        this.token = options.token
        this.ownerId = options.ownerId

        require("@/sqlite.js")(this)
        require("@/pages.js")(this)
        require("@commands")(this)
    }

    /**
     * Attempts to login to Discord with the Bot's token
     */
    async login() {
        if (this.client.status === null || this.client.status == 5) {
            this.logger.working("discord", "Logging in...")

            await this.client.login(this.token).catch(err => {
                this.logger.error("discord", "Connection error: " + err.message)
            })
        }
    }
}

