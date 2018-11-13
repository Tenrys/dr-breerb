const CommandStore = require("@commands/CommandStore.js")

const chalk = require("chalk")

const path = require("path")
const fs = require("fs")

const parse = require("@utils/parseargs.js")

module.exports = bot => {
    bot.logger.working("commands", "Loading...")

    bot.commands = new CommandStore()

    // Load commands
    fs.readdirSync(__dirname).forEach(dir => {
        let dirPath = path.join(__dirname, dir)
        if (fs.statSync(dirPath).isDirectory()) {
            fs.readdirSync(dirPath).forEach(file => {
                let filePath = path.join(dirPath, file)
                if (fs.statSync(filePath).isFile()) {
                    let cmd = new (require(filePath))(bot)
                    cmd.name = path.basename(filePath, path.extname(filePath))
                    cmd.category = path.basename(dirPath)

                    bot.commands.add(cmd)
                }
            })
        }
    })

    // Command handler
    bot.prefix = "!"
    bot.client.on("message", async msg => {
        if (msg.webhookID) return
        if (bot.ignoreList && bot.ignoreList[msg.author.id]) return
        if (bot.ownerOnly && !bot.ownerId.includes(msg.author.id)) return

        let match = new RegExp(`^<@${bot.client.user.id}>\\s*([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)

        if (!match) {
            let prefix = bot.prefix
            if (msg.guild) {
                await bot.db.GuildSettings.sync()
                await bot.db.GuildSettings.findOrCreate({
                    where: {
                        guild: msg.guild.id,
                    }
                }).spread((settings, created) => {
                    prefix = settings.prefix
                })
            }

            match = new RegExp(`^${prefix}([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)
        }

        if (match && match[1]) {
            let name = match[1].toLowerCase()
            let line = match[2].trim()
            let args = []
            try { args = parse(line) } catch (err) {}

            let cmd = bot.commands.get(name)
            if (cmd && cmd.callback) {
                // Verify
                if (cmd.guildOnly && !msg.guild) { msg.reply(cmd.error("This command can only be used while in a guild.")); return }
                if (cmd.ownerOnly && !bot.ownerId.includes(msg.author.id)) {
                    msg.reply(cmd.error("This command can only be used by the bot's owner."))
                    bot.logger.error(`command-${name}`, `Invalid permissions from '${msg.author.tag}' (${msg.author.id}).`)
                    return
                }
                if (cmd.permissions) {
                    if (cmd.permissions.bot) {
                        for (const permission of cmd.permissions.bot) {
                            if (!msg.guild.me.hasPermission(permission)) {
                                msg.reply(cmd.error(`I do not have the permission to \`${permission}\`.`))
                                bot.logger.error(`command-${name}`, `Invalid permissions for bot from'${msg.author.tag}' (${msg.author.id}) (${permission}).`)
                                return
                            }
                        }
                    }
                    if (cmd.permissions.user) {
                        for (const permission of cmd.permissions.user) {
                            if (!msg.member.hasPermission(permission)) {
                                msg.reply(cmd.error(`You do not have the permission to \`${permission}\`.`))
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
                            msg.printBuffer = msg.printBuffer + this.bot.inspectCodeBlock(val, true) + "\n"
                        })
                    }

                    await cmd.callback(msg, line, ...args)

                    if (msg.printBuffer) await msg.channel.send(`\`\`\`\n${bot.truncate(msg.printBuffer)}\n\`\`\``)
                    if (cmd.postRun) await cmd.postRun(msg)
                } catch (err) {
                    msg.reply(cmd.error(bot.errorToMarkdown(err), `JavaScript error: from command '${name}'`))
                    bot.logger.error(`command-${name}`, `Error: ${err.stack || err}`)
                }
            }
        }
    })

    let commandAmt = Object.keys(bot.commands.get()).length
    bot.logger.success("commands", `Loaded ${commandAmt} command${commandAmt == 1 ? '' : 's'}.`)

    bot.client.on("ready", () => {
        bot.client.user.setActivity(`${bot.prefix}help`, { type: "LISTENING" })
    })
}

