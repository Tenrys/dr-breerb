
const Discord = require("discord.js")
const Color = require("color")

let category = {
	commands: {},
	description: "Color roles for everyone!",
	name: "colors",
	printName: ":paintbrush: Colors"
}

// TODO:

function cleanColorRoles(member) {
	if (member) {
		if (member.guild.me.hasPermission("MANAGE_ROLES")) {
			member.roles.filter(role => role.name.match("^#")).every(role => {
				member.roles.remove(role).then(() => {
					if (role.members.array().length < 1) {
						role.delete()
					}
				})
			})
		}
	} else {
		client.guilds.filter(guild => guild.me.hasPermission("MANAGE_ROLES")).every(guild => {
			guild.roles.filter(role => role.name.match("^#") && role.members.array().length < 1).every(role => role.delete())
		})
	}
}
category.commands.color = {
	callback: async function(msg, line, r, g, b) {
		if (!msg.guild.me.hasPermission("MANAGE_ROLES")) { msg.reply("I am not allowed to manage roles."); return }

		if (!msg.member) { msg.reply("webhooks are unsupported."); return } // Could also be trying to use userbot as bot, that shit doesn't work for some reason lol

		let color
		try {
			if (r !== undefined && g !== undefined && b !== undefined) {
				r = parseInt(r, 10)
				g = parseInt(g, 10)
				b = parseInt(b, 10)
				if (isNaN(r) || isNaN(g) || isNaN(b)) {
					throw new Error("RGB value is NaN")
				}

				color = Color.rgb(r, g, b)
			} else if (r !== undefined && (g === undefined || b === undefined)) {
				r = /^#?([a-fA-F0-9_]+)/.exec(r)[1]

				color = Color(parseInt(r, 16))
			} else {
				cleanColorRoles(msg.member)
				msg.reply("I reset your color roles.")
				return
			}
		} catch (e) {
			console.log("Color parsing error: ", e)
			msg.reply("invalid color.")
			return
		}

		if (!color) { msg.reply("invalid color."); return }

		cleanColorRoles(msg.member)

		let role = msg.guild.roles.find(role => role.name.match("^" + color.hex()))

		if (!role) {
			role = await msg.guild.roles.create({
				data: {
					name: color.hex(),
					color: color.hex(),
					hoist: false,
					position: msg.guild.me.roles.highest.position
				},
				reason: "created by " + msg.guild.me.user.tag
			})
		}

		msg.member.roles.add(role)

		let embed = new Discord.MessageEmbed()
			.setDescription(`<@${msg.author.id}>'s color is now <@&${role.id}>.`)
			.setColor(color.hex())

		msg.channel.send(embed)
	},
	help: "Set your username color using a role. Supported color formats are Hexadecimal and RGB. Call without arguments to reset your color.",
	guildOnly: true
}

client.on("ready", function() {
	setInterval(60 * 60 * 1000, function() {
		cleanColorRoles()
	})

	cleanColorRoles()
})

module.exports = category

