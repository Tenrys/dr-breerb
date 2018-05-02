
const Discord = require("discord.js")
const fs = require("fs")
const https = require("https")
const http = require("http")
const path = require("path")
const shell = require("shelljs")
const util = require("util")

let repoPath = "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/chatsounds/autoadd/"
function truncate(res) {
	if (res.length > 1970) {
		return res.substr(0, 1970) + "\n[...] (output truncated)"
	} else {
		return res
	}
}

/* TODO: Page system for chatsound search
 * TODO: Suggest chatsounds instead of saying "invalid"
 * TODO: Allow overlapping chatsounds on top of another, !stop command stops all (add "sh"?)
 * TODO: Add modifiers somehow
 * TODO: Better sort algorithm for search
 */

let commands = {
	ping: {
		callback: function(msg, line, ...args) {
			msg.reply("hi!")
		},
		help: "Pings the bot."
	},
	join: {
		callback: async function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel
			if (!vc) {
				vc = msg.member.voiceChannel

				if (vc) {
					await vc.join()
				} else {
					msg.reply("you aren't in any channel.")
				}
			} else {
				if (!vc.connection) {
					console.log("No connection? What.")
					await vc.leave()
					await vc.join()
				}
			}

			return vc
		},
		guildOnly: true,
		help: "Makes the bot join the voice channel you are currently in."
	},
	leave: {
		callback: function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel

			if (vc) {
				vc.leave()
			} else {
				msg.reply("I am not in any channel.")
			}
		},
		guildOnly: true,
		help: "Makes the bot leave the voice channel it's in."
	},
	play: {
		callback: async function(msg, line, ...args) {
			if (!soundlistKeys) { return }

			let vc = await commands["join"].callback(msg)

			line = line.toLowerCase().trim()

			if (vc && vc.connection) {
				let snd, sndInfo

				// Are we trying to get a random chatsound
				if (line == "random") {
					snd = soundlistKeys[Object.keys(soundlistKeys).random()]
					sndInfo = snd.random()
				} else { // If not
					// Check if we want a specific chatsound
					let num = /#(\d+)$/gi.exec(line)
					if (num) { num = num[1] }
					line = line.replace(/#\d+$/gi, "")

					// Get the chatsound and its variants
					snd = soundlistKeys[line]
					if (!snd) {
						msg.reply("invalid chatsound.")
						return
					}

					// Determine which variant to play
					if (num !== undefined && num !== null) {
						num = Math.floor(Math.max(0, Math.min(parseInt(num, 10) - 1, snd.length - 1)))
						sndInfo = snd[num]
					} else {
						sndInfo = snd.random()
					}
				}

				let sndPath = new RegExp("^chatsounds/autoadd/(.*)").exec(sndInfo.path)[1]
				let filePath = path.join("cache", sndPath)

				let playFile = new Promise(function(resolve) {
					if (!fs.existsSync(filePath)) {
						console.log(sndPath, ": download")

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
					let audio = vc.connection.play(fs.createReadStream(filePath), { volume: 0.33 })
					audio.on("start", () => console.log(sndPath, ": start"))
					audio.on("end", () => console.log(sndPath, ": end"))
				})
			} else {
				msg.reply("I am not in any channel?")
			}
		},
		guildOnly: true,
		help: "Plays a custom chatsound from the GitHub repository. Does not support chatsounds from games like Half-Life 2, and such."
	},
	stop: {
		callback: function(msg, line, ...args) {
			let vc = msg.guild.me.voiceChannel
			if (vc && vc.connection && vc.connection.dispatcher) {
				vc.connection.dispatcher.end()
			}
		},
		guildOnly: true,
		help: "Stops playing a chatsound."
	},
	volume: {
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
		guildOnly: true,
		help: "Changes the volume of the current chatsound. It does not persist through chatsounds!\n\nVolume can be between 0 and 1. Default volume is 0.6."
	},
	search: { // TODO: Page system???
		callback: function(msg, line) {
			line = line.toLowerCase().trim()

			let results = []
			for (key in soundlistKeys) {
				if (soundlistKeys.hasOwnProperty(key)) {
					if (key.toLowerCase().trim().indexOf(line) !== -1) {
						results.push(key)
					}
				}
			}
			results.sort(function(a, b) {
				return a.length < b.length
			})

			let buf = ""
			for (let i = 0; i < 10; i++) {
				if (!results[i]) { break }
				buf = buf + (i + 1) + `. \`${results[i]}\`\n`
			}

			let embed = new Discord.MessageEmbed()
				.setAuthor(msg.author.tag, msg.author.avatarURL())
				.setTitle("Chatsound search results:")
				.setDescription(buf)

			msg.channel.send(embed)
		},
		help: "Searches chatsounds by name."
	},
	commands: {
		callback: function(msg, line, ...args) {
			msg.reply("here are the available commands:\n`" + Object.keys(commands).join(", ") + "`")
		},
		help: "Displays the list of available commands."
	},
	help: {
		callback: function(msg, line, cmd) {
			cmd = cmd.toLowerCase().trim()

			if (commands[cmd]) {
				msg.reply(cmd + ": " + (commands[cmd].help || "no help provided."))
			} else {
				msg.reply("no help for an unknown command.")
			}
		},
		help: "Displays information about a command."
	},
	eval: {
		callback: function(msg, line) {
			if (msg.author.id === "138685670448168960") {
				try {
					let ret = eval(line)

					if (typeof ret !== "string")
						ret = util.inspect(ret)

					let embed = new Discord.MessageEmbed()
						.setColor(0xE2D655)
						.setAuthor(msg.author.tag, msg.author.avatarURL())
						.setTitle("JavaScript result:")
						.setDescription(
`\`\`\`js
${truncate(ret)}
\`\`\``)

					msg.channel.send(embed)
				} catch (err) {
					let embed = new Discord.MessageEmbed()
						.setColor(0xE25555)
						.setAuthor(msg.author.tag, msg.author.avatarURL())
						.setTitle("JavaScript error:")
						.setDescription(
`\`\`\`js
${truncate(err)}
\`\`\``)

					msg.channel.send(embed)
				}
			}
		},
		help: "Executes JavaScript code and returns its value. Owner only."
	}
}
module.exports = commands

