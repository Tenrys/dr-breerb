
// TODO: Make forin a reusable module instead of polluting global scope..maybe

// Load libraries
const Discord = require("discord.js")
const client = new Discord.Client()
module.exports = client

const fs = require("fs")
const path = require("path")

const logger = require("./logging.js")
logger.log("status", "Starting")

// Custom fancy stuff
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
let github = JSON.parse(fs.readFileSync("./package.json")).repository + "/tree/master"
global.prettifyError = function(err) {
	if (err.stack) {
		let trace = err.stack
		let regex = new RegExp(path.join(process.cwd(), "/").replace(/\\/g, "\\\\") + "(.*):(\\d*):(\\d*)", "gi")
		trace = trace.replace(regex, `[$1\\:$2\\:$3](${github}/$1#L$2)`)
		return trace
	} else { return err }
}

// TODO: Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// TODO: Future parity with Dream Bot Mark II: need translate, Steam info and MyAnimeList support

const repl = require("repl")
client.on("ready", function() {
	logger.log("discord", `Logged in as ${client.user.tag}!`)

	let replServer = repl.start("")
	replServer.context.Discord = Discord
	replServer.context.client = client
	replServer.on("exit", () => {
		process.exit()
	})
	logger.log("repl", "Ready")
})

// Load our own stuff
client.ownerId = "138685670448168960"
const commands = require("./commands.js")

// Begin
client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

process.on("uncaughtException", (err) => {
	logger.error(`critical`, `JavaScript unhandled exception: ${err.stack || err}`)

	try {
		let embed = new Discord.MessageEmbed()
			.setColor(0xE25555)
			.setTitle(`:interrobang: JavaScript unhandled exception`)
			.setDescription(prettifyError(err))

		client.users.get(client.ownerId).send(embed)
	} catch (err) {
		logger.error("critical", `holy fuck is this wrong: Discord.js is also broken!!!\n${err}`)
	}

	logger.error("critical", "Quitting to avoid unforeseen consequences")
	process.exit()
})
