const fs = require("fs")
const https = require("https")
const http = require("http")
const path = require("path")
const shell = require("shelljs")

if (!fs.existsSync("cache")) {
	fs.mkdirSync("cache")
}

let currentFile
let repoPath = "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/chatsounds/autoadd/"

let commands = {
	"ping": {
		callback: function(msg, line, ...args) {
			msg.reply("hi!")
		},
		help: "Pings the bot."
	},
	"join": {
		callback: function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel
			if (!vc) {
				vc = msg.member.voiceChannel

				if (vc) {
					vc.join()
				} else {
					msg.reply("you aren't in any channel.")
				}
			} else {
				if (!vc.connection) {
					vc.leave()
					vc.join()
				}
			}

			return vc
		},
		help: "Makes the bot join the voice channel you are currently in."
	},
	"leave": {
		callback: function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel

			if (vc) {
				vc.leave()
			} else {
				msg.reply("I am not in any channel.")
			}
		},
		help: "Makes the bot leave the voice channel it's in."
	},
	"play": {
		callback: function(msg, line, ...args) {
			if (!soundlistKeys) { return }

			let vc = commands["join"].callback(msg)

			line = line.toLowerCase().trim()

			if (vc && vc.connection) {
				let num = /#(\d+)$/gi.exec(line)
				if (num) { num = num[1] }
				line = line.replace(/#\d+$/gi, "")

				let sndPath = soundlistKeys[line]
				if (!sndPath) {
					msg.reply("invalid chatsound.")
					return
				}

				let sndInfo
				if (num !== undefined && num !== null) {
					num = Math.floor(Math.max(0, Math.min(parseInt(num, 10) - 1, sndPath.length - 1)))
					sndInfo = sndPath[num]
				} else {
					sndInfo = sndPath.random()
				}
				sndPath = new RegExp("^chatsounds/autoadd/(.*)").exec(sndInfo.path)[1]

				let filePath = path.join("cache", sndPath)

				let playFile = new Promise(function(resolve) {
					if (!fs.existsSync(filePath)) {
						let dir = /(.*)\/.*$/gi.exec(sndPath)
						shell.mkdir("-p", path.join("cache", dir[1]))

						let request = https.get(repoPath + encodeURI(sndPath), function(response) {
							if (response.statusCode == 200) {
								let writeFile = fs.createWriteStream(filePath)
								writeFile.on("finish", resolve)

								response.pipe(writeFile)
							}
						})
					} else {
						resolve()
					}
				}).then(function() {
					let audio = vc.connection.playFile(filePath, { volume: 0.33 })
					audio.on("end", function() {
						// vc.leave()
					})
					audio.file = filePath
				})
			} else {
				msg.reply("I am not in any channel?")
			}
		},
		help: "Plays a custom chatsound from the GitHub repository. Does not support chatsounds from games like Half-Life 2, and such."
	},
	"stop": {
		callback: function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel
			if (vc && vc.connection && vc.connection.dispatcher) {
				vc.connection.dispatcher.end()
			}
		},
		help: "Stops playing a chatsound."
	},
	"volume": {
		callback: function(msg, line, vol, ...args) {
			let vc = msg.guild.me.voiceChannel

			if (vc && vc.connection && vc.connection.dispatcher) {
				let volume = Math.min(1, Math.max(0, vol))
				let playing = vc.connection.dispatcher

				if (!vol) {
					msg.reply("volume: " + playing.volume * 100 + "%.")
				} else {
					playing.setVolume(volume)
					msg.reply("changed playing chatsound's volume to " + playing.volume * 100 + "%.")
				}
			} else {
				msg.reply("I am not in any channel.")
			}
		},
		help: "Changes the volume of the current chatsound. It does not persist through chatsounds!\n\nVolume can be between 0 and 1. Default volume is 0.6."
	},
	"commands": {
		callback: function(msg, line, ...args) {
			msg.reply("here are the available commands:\n`" + Object.keys(commands).join(", ") + "`")
		},
		help: "Displays the list of available commands."
	},
	"help": {
		callback: function(msg, line, cmd) {
			cmd = cmd.toLowerCase().trim()

			if (commands[cmd]) {
				msg.reply(cmd + ": " + (commands[cmd].help || "no help provided."))
			} else {
				msg.reply("no help for an unknown command.")
			}
		},
		help: "Displays information about a command."
	}
}
module.exports = commands