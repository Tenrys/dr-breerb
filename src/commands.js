const Command = require("./classes/Command.js")
const CommandCategory = require("./classes/CommandCategory.js")

const chalk = require("chalk")

const fs = require("fs")
const path = require("path")

const parse = require("./lib/parseargs.js")

module.exports = bot => {
    bot.logger.working("commands", "Loading...")

    // Prepare command storage
    /**
     * The object containing all CommandCategories for the bot.
     */
    bot.commands = {
        /**
         * Looks for and returns a CommandCategory first, then a Command, otherwise the CommandCategory listing all Commands.
         * @param {string} query The name of the category or command you are looking for.
         */
        get(query) {
            // Look for a category first...
            if (this[query] && this[query] instanceof CommandCategory) {
                return this[query]
            } else { // We didn't find one:
                // Find a command with the specified name
                let cmd = this.all.commands.get(query)
                // If it exists, return it
                if (cmd && cmd instanceof Command) {
                    return cmd
                } else { // Otherwise return the CommandCategory listing all commands.
                    return this.all
                }
            }
        },

        /**
         * The CommandCategory listing all commands.
         */
        all: new CommandCategory("all", ":star: All commands", "Every command available.")
    }
    Object.defineProperty(bot.commands.all.commands, "_commands", { // Quite the hack...
        get() {
            let commands = {}

            for (const name in bot.commands) {
                if (bot.commands.hasOwnProperty(name)) {
                    const category = bot.commands[name]

                    if (name !== "all" && category instanceof CommandCategory) {
                        for (const name in category.commands._commands) {
                            if (category.commands._commands.hasOwnProperty(name)) {
                                const command = category.commands._commands[name]
                                commands[name] = command
                            }
                        }
                    }
                }
            }

            return commands
        }
    })

    // Load commands
    let commandsPath = path.join(__dirname, "commands")
    fs.readdirSync(commandsPath).forEach(dir => {
        let dirPath = path.join(commandsPath, dir)
        if (fs.statSync(dirPath).isDirectory()) {
            let category = require(dirPath)
            fs.readdirSync(dirPath).forEach(file => {
                let filePath = path.join(dirPath, file)
                if (fs.statSync(filePath).isFile() && file !== "index.js") {
                    require(filePath)(category, bot)
                }
            })
            bot.commands[category.name] = category
        }
    })

    // Command handler
    let prefix = "!"
    bot.client.on("message", async msg => {
        if (bot.ignoreList && bot.ignoreList[msg.author.id]) { return }
        if (bot.ownerOnly && !bot.ownerId.includes(msg.author.id)) { return }

        let match = new RegExp(`^${prefix}([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)
        if (match && match[1]) {
            let name = match[1].toLowerCase()
            let line = match[2].trim()
            let args = []
            try { args = parse(line) } catch (err) {}

            let cmd = bot.commands.get(name)
            if (cmd && cmd.callback) {
                // Verify
                if (cmd.guildOnly && !msg.guild) { msg.error("This command can only be used while in a guild."); return }
                if (cmd.ownerOnly && !bot.ownerId.includes(msg.author.id)) {
                    msg.error("This command can only be used by the bot's owner.")
                    bot.logger.error(`command-${name}`, `Invalid permissions from '${msg.author.tag}' (${msg.author.id}).`)
                    return
                }
                if (cmd.permissions) {
                    if (cmd.permissions.bot) {
                        for (const permission of cmd.permissions.bot) {
                            if (!msg.guild.me.hasPermission(permission)) {
                                msg.error(`I do not have the permission to \`${permission}\`.`)
                                bot.logger.error(`command-${name}`, `Invalid permissions for bot from'${msg.author.tag}' (${msg.author.id}) (${permission}).`)
                                return
                            }
                        }
                    }
                    if (cmd.permissions.user) {
                        for (const permission of cmd.permissions.user) {
                            if (!msg.member.hasPermission(permission)) {
                                msg.error(`You do not have the permission to \`${permission}\`.`)
                                bot.logger.error(`command-${name}`, `Invalid permissions from '${msg.author.tag}' (${msg.author.id}) (${permission}).`)
                                return
                            }
                        }
                    }
                }

                // Log
                bot.logger.log(`command-${name}`, `Ran by '${msg.author.tag}' (${msg.author.id})`)
                    bot.logger.detail("in channel", `${msg.channel.name || msg.channel.recipient.tag + "'s DMs"} (${msg.channel.id})`)
                    if (msg.guild) bot.logger.detail("in guild", `${msg.guild.name} (${msg.guild.id})`)
                    if (line) bot.logger.detail("passed line", `${chalk.yellowBright(line.replace('\n', '\\n'))}`)

                // Run
                try {
                    msg.printBuffer = ""
                    msg.print = (...args) => {
                        args.forEach(val => {
                            msg.printBuffer = msg.printBuffer + val.toString() + "\n"
                        })
                    }

                    await cmd.callback(msg, line, ...args)

                    if (msg.printBuffer) await msg.channel.send(`\`\`\`\n${bot.truncate(msg.printBuffer)}\n\`\`\``)
                    if (cmd.postRun) await cmd.postRun(msg)
                } catch (err) {
                    msg.error(bot.formatErrorToDiscord(err), `JavaScript error: from command '${name}'`)
                    bot.logger.error(`command-${name}`, `Error: ${err.stack || err}`)
                }
            }
        }
    })

    let commandAmt = Object.keys(bot.commands.all.commands._commands).length
    bot.logger.success("commands", `Loaded ${commandAmt} command${commandAmt == 1 ? '' : 's'}.`)

    bot.client.on("ready", () => {
        bot.client.user.setActivity(`${prefix}help`, { type: "LISTENING" })
    })
}

