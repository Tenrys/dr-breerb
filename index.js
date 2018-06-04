// TODO: Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// TODO: Add more JSDoc stuff around the code
// TODO: Future parity with Dream Bot Mark II: need translate, Steam info and MyAnimeList support
// TODO: Make forin a reusable module instead of polluting global scope..maybe

// Load libraries
const Discord = require("discord.js")
const client = new Discord.Client()
module.exports = client

const logger = require("./logging.js")
logger.working("status", "Starting...")

const fs = require("fs")
const path = require("path")

// Convenience functions
Object.defineProperty(Array.prototype, "random", {
	value: function() {
		return this[Math.floor(Math.random() * this.length)]
	}
})
global.forin = function(obj, callback) { // I can't be fucked writing this over and over
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]
			callback(key, value)
		}
	}
}

// General error handling and formatting
let github = JSON.parse(fs.readFileSync("./package.json")).repository + "/tree/master"
global.prettifyError = function(err) {
	if (err.stack) {
		let trace = err.stack
		let regex = new RegExp(path.join(process.cwd(), "/").replace(/\\/g, "\\\\") + "(.*):(\\d*):(\\d*)", "gi")
		trace = trace.replace(regex, `[$1\\:$2\\:$3](${github}/$1#L$2)`)
		return trace
	} else { return err }
}
process.on("uncaughtException", (err) => {
	logger.error("critical", `JavaScript unhandled exception: ${err.stack || err}`)

	try {
		let embed = new Discord.MessageEmbed()
			.setColor(0xE25555)
			.setTitle(`:interrobang: JavaScript unhandled exception`)
			.setDescription(prettifyError(err))

		client.users.get(client.ownerId).send(embed)
	} catch (err) {
		logger.error("critical", `Couldn't send message to owner: ${err.stack || err}`)
	}

	logger.error("critical", "Quitting to avoid unforeseen consequences.")
	process.exit()
})

client.on("error", (ev) => {
	logger.error("discord", "Websocket error: " + ev.message)
})
client.on("warn", (ev) => {
	logger.warn("discord", "Websocket warning: " + ev.message)
})
client.on("reconnecting", () => {
	logger.warn("discord", "Websocket reconnecting...")
})
client.on("resumed", (count) => {
	logger.log("discord", `Websocket resumed. (${count} events replayed)`)
})
client.on("disconnect", (ev) => {
	logger.error("discord", `Websocket disconnected: ${ev.reason} (code ${ev.code})`)
	login()
})
const repl = require("repl")
client.on("ready", function() {
	let replServer = repl.start("")
	replServer.context.Discord = Discord
	replServer.context.client = client
	replServer.on("exit", () => {
		process.exit()
	})
	logger.success("repl", "Ready.")
})

// Load our own stuff
client.ownerId = "138685670448168960"
const commands = require("./commands.js")

// Begin
async function login() {
	let connecting = false,
		failed = false,
		connected = false
	while (!connected) {
		if ((client.status === null || client.status == 5) && !connecting) {
			connecting = true
			if (!failed) {
				logger.working("discord", "Logging in...")
			} else {
				logger.working("discord", "Retrying...")
			}

			await client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())
				.then(() => {
					logger.success("discord", `Logged in as ${client.user.tag}.`)
					connecting = false
					failed = false
					connected = true
				})
				.catch((err) => {
					logger.error("discord", "Connection error: " + err.message)
					connecting = false
					failed = true
					connected = false
				})
		}
	}
}
login()

logger.success("status", "Started.")
