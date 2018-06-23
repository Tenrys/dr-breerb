class InvalidArgumentException extends Error {
	/**
	 * @param {string} name The argument's name.
	 * @param {string} type The expected type of the argument.
	 */
	constructor(name, type) {
		this.name = "InvalidArgumentException"
		this.message = `'${name}' needs to be of type '${type}'`
	}
}

/**
 * A chat command to be used by a Discord user.
 */
class Command {
	/**
	 * @param {string} name The Command's name.
	 * @param {function} callback The Command's callback.
	 * @param {object} [options] Additional variables.
	 */
	constructor(name, callback, options) {
		if (typeof name !== "string") { throw new InvalidArgumentException("name", "string") }
		if (typeof callback !== "function") { throw new InvalidArgumentException("callback", "function") }
		if (options !== undefined && typeof options !== "object") { throw new InvalidArgumentException("options", "object") }

		this.name = name
		this.callback = callback
		this.help = options.help || "No information provided."
		this.guildOnly = options.guildOnly || false
		this.ownerOnly = options.ownerOnly || false
		this.aliases = options.aliases || []
		this.postRun = options.postRun
	}
}

/**
 * Stores Commands, used for sorting by their name and description.
 */
class CommandCategory {
	/**
	 * @param {string} name The CommandCategory's internal name.
	 * @param {string} [printName=Unnamed] The command category's display name.
	 * @param {string} [desc=No information provided.] The command category's description.
	 */
	constructor(name, printName="Unnamed", desc="No information provided.") {
		this._commands = []
		this.description = desc
		this.name = name
		this.printName = printName
	}

	/**
	 * Adds a command to the CommandCategory.
	 * @param {string} name The command's name.
	 * @param {function} callback The command's callback.
	 * @param {object} [options] Additional options.
	 */
	addCommand(name, callback, options) {
		let command = new Command(name, callback, options)
		command.category = this
		this._commands.push(command)
		return command
	}

	/**
	 * The list of commands in the CommandCategory.
	 */
	get commands() {
		let commands = this._commands
		commands.__proto__.get = function(name) {
			if (name === undefined) {
				return commands
			}
			return commands.filter(x => {
				return x.name == name || x.aliases.includes(name)
			})[0]
		}
		return commands
	}
	set commands(a) {
		if (typeof a !== "object") { throw new InvalidArgumentException("aliases", "object") }

		this._commands = a
	}
}

module.exports = {
	Command,
	CommandCategory
}

const logger = require("./logging.js")
logger.working("commands", "Loading...")

const bot = require("./index.js")
const parse = require("./parseargs.js")
const chalk = require("chalk")
const Discord = require("discord.js")
const fs = require("fs")
const path = require("path")

/**
 * The object containing all CommandCategories for the bot.
 */
let categories = {
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
Object.defineProperty(categories.all, "_commands", { // Quite the hack...
	get() {
		let commands = []

		forin(categories, (name, category) => {
			if (name !== "all" && category instanceof CommandCategory) {
				category._commands.forEach(command => {
					commands.push(command)
				})
			}
		})

		return commands
	}
})

fs.readdirSync("./commands").forEach(file => {
	let dirPath = "./commands/" + file
	if (fs.statSync(dirPath).isDirectory()) {
		let category = require(dirPath)
		fs.readdirSync(dirPath).forEach(file => {
			let filePath = path.join(dirPath, file)
			if (fs.statSync(filePath).isFile() && file !== "index.js") {
				require("./" + filePath)(category, bot)
			}
		})
		categories[category.name] = category
	}
})

// Command handler

function logDetail(name, details) {
	logger.log(` ${chalk.magentaBright('*')} ${name}: ${details}`)
}

let prefix = "!"
bot.commands = categories
bot.client.on("message", async function(msg) {
	if (bot.ignoreList && bot.ignoreList[msg.author.id]) { return }
	if (bot.ownerOnly && msg.author.id !== bot.ownerId) { return }

	let match = new RegExp(`^${prefix}([^\\s.]*)\\s?([\\s\\S]*)`, "gmi").exec(msg.content)
	if (match && match[1]) {
		let cmd = match[1].toLowerCase()
		let line = match[2].trim()
		let args = []
		try {
			args = parse(line)
		} catch {}

		let action = bot.commands.get().commands.get(cmd)
		if (action && action.callback) {
			if (action.guildOnly && !msg.guild) {
				msg.reply("this command can only be used while in a guild.")
				return
			}
			if (action.ownerOnly && msg.author.id !== bot.ownerId) {
				msg.reply("this command can only be used by the bot's owner.")
				logger.error(`command-${cmd}`, `Invalid permissions from '${msg.author.tag}' (${msg.author.id}).`)
				return
			}

			logger.log(`command-${cmd}`, `Ran by '${msg.author.tag}' (${msg.author.id})`)
				logDetail("in channel", `${msg.channel.name} (${msg.channel.id})`)
				if (msg.guild) {
					logDetail("in guild", `${msg.guild.name} (${msg.guild.id})`)
				}
				logDetail("passed line", `${chalk.yellowBright(line.replace('\n', '\\n'))}`)

			try {
				msg.printBuffer = ""
				msg.print = function(...args) {
					args.forEach(val => {
						msg.printBuffer = msg.printBuffer + val.toString() + "\n"
					})
				}

				await action.callback(msg, line, ...args)

				if (msg.printBuffer) {
					await msg.channel.send(`\`\`\`\n${bot.truncate(msg.printBuffer)}\n\`\`\``)
				}
				if (action.postRun) {
					action.postRun(msg)
				}
			} catch (err) {
				let embed = new Discord.MessageEmbed()
					.setColor(0xE25555)
					.setTitle(`:interrobang: JavaScript error: from command '${cmd}'`)
					.setDescription(bot.formatErrorToDiscord(err))

				logger.error(`command-${cmd}`, `Error: ${err.stack || err}`)
				msg.channel.send(embed)
			}
		}
	}
})

let commandAmt = categories.all.commands.length
logger.success("commands", `Loaded ${commandAmt} command${commandAmt == 1 ? '' : 's'}.`)

bot.client.on("ready", function() {
	this.user.setActivity(`${prefix}help`, { type: "LISTENING" })
})
