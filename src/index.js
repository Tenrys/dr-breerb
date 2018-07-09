// TODO: Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// TODO: Make forin a reusable module instead of polluting global scope..maybe

const logger = require("./logging.js")
logger.working("status", "Starting...")

// Convenience functions
Object.defineProperty(Array.prototype, "random", {
	value() {
		return this[Math.floor(Math.random() * this.length)]
	}
})
/**
 * Function equivalent of the standard for in loop... Because it takes too much time to write.
 */
global.forin = function(obj, callback) { // I can't be fucked writing this over and over
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]
			let cont = callback(key, value)
			if (cont === false) { return }
		}
	}
}

const Discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const repl = require("repl")

class Bot {
	/**
	 * The Discord user ID of the bot's owner.
	 */
	get ownerId() { return "138685670448168960" }

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
		if (str.length > 1970) {
			return str.substr(0, 1970) + "\n[...] (output truncated)"
		} else {
			return str
		}
	}

	/**
	 * @param {string} token The Discord user token to login with
	 */
	constructor(token) {
		let bot = this

		let client = new Discord.Client()

		client.on("ready", () => {
			let replServer = repl.start("")
			replServer.context.Discord = Discord
			replServer.context.bot = bot
			replServer.on("exit", () => {
				process.exit()
			})
			logger.success("repl", "Ready.")
		})
		client.on("error", ev => {
			logger.error("discord", "Websocket error: " + ev.message)
		})
		client.on("reconnecting", () => {
			logger.warn("discord", "Websocket reconnecting...")
		})
		client.on("resumed", count => {
			logger.log("discord", `Websocket resumed. (${count} events replayed)`)
		})
		client.on("disconnect", ev => {
			logger.error("discord", `Websocket disconnected: ${ev.reason} (code ${ev.code})`)
			login() // Not sure if this works, but try starting the bot again if we get disconnected
		})
		client.on("warn", ev => {
			logger.warn("discord", "Websocket warning: " + ev.message)
		})

		this.client = client
		this.token = token
	}

	/**
	 * Attempts to login to Discord with the Bot's token
	 */
	async login() {
		if (this.client.status === null || this.client.status == 5) {
			logger.working("discord", "Logging in...")

			await this.client.login(this.token)
				.then(() => {
					logger.success("discord", `Logged in as ${this.client.user.tag}.`)
				})
				.catch(err => {
					logger.error("discord", "Connection error: " + err.message)
				})
		}
	}
}

let bot = new Bot(fs.readFileSync("token", { encoding: "utf-8" }).trim())

module.exports = bot

process.on("uncaughtException", err => {
	logger.error("critical", `JavaScript unhandled exception: ${err.stack || err}`)

	try {
		let embed = new Discord.MessageEmbed()
			.setColor(0xE25555)
			.setTitle(`:interrobang: JavaScript unhandled exception`)
			.setDescription(bot.formatErrorToDiscord(err))

		bot.client.users.get(bot.client.ownerId).send(embed)
	} catch (err) {
		logger.error("critical", `Couldn't send message to bot owner: ${err.stack || err}`)
	}

	logger.error("critical", "Quitting to avoid unforeseen consequences.")
	process.exit()
})

require("./sqlite.js")
require("./commands.js")
bot.login()

logger.success("status", "Started.")
