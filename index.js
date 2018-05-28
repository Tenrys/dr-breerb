
// TODO: Make forin a reusable module instead of polluting global scope..maybe

// Load libraries
const Discord = require("discord.js")
const client = new Discord.Client()
module.exports = client

const http = require("http")
const fs = require("fs")

const logger = require("./logging.js")

// Custom fancy stuff
Array.prototype.random = function() {
	return this[Math.floor((Math.random() * this.length))]
}
global.forin = function(obj, callback) { // I can't be fucked writing this over and over
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]
			callback(key, value)
		}
	}
}

// Load our own stuff
const commands = require("./commands.js")

// TODO: Refer to https://github.com/Re-Dream/dreambot_mk2/projects/1 for other todos, basically
// TODO: Future parity with Dream Bot Mark II: need translate, Steam info and MyAnimeList support
client.ownerId = "138685670448168960"

client.on("ready", function() {
	logger.log("discord", `Logged in as ${client.user.tag}!`)
})

// Begin
client.login(fs.readFileSync("token", { encoding: "utf-8" }).trim())

