const Discord = require("discord.js")
const Color = require("color")
const ColorThief = require("color-thief-jimp")
const Jimp = require("jimp")

module.exports = (category, bot) => {
    /**
     * If provided a member, will clean that member's roles with name starting with "#".
     * Otherwise, will clean every guild's roles with name starting with "#" if they have no members.
     * @param {Discord.Member} [member]
     */
    async function cleanColorRoles(member) {
        if (member) {
            if (member.guild.me.hasPermission("MANAGE_ROLES")) {
                await member.roles.filter(role => role.name.match("^#")).every(role => member.roles.remove(role))
            }
        } else {
            await bot.client.guilds.filter(guild => guild.me.hasPermission("MANAGE_ROLES")).every(guild => {
                guild.roles.filter(role => role.name.match("^#") && role.members.array().length < 1).every(role => role.delete())
            })
        }
    }

    category.addCommand("color", async function(msg, line, r, g, b) {
        if (!msg.member) { msg.reply("webhooks are unsupported."); return } // Could also be trying to use userbot as bot, that shit doesn't work for some reason lol

        line = line.toLowerCase()
        r = r || line

        let color
        if (line == "avatar") {
            let img = await Jimp.read(msg.author.avatarURL({ format: "png" }))
            let dominant = ColorThief.getColor(img)
            color = Color({ r: dominant[0], g: dominant[1], b: dominant[2] })
        } else {
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
                    r = /^#?([a-fA-F0-9_]+)/.exec(r)
                    if (!r) {
                        throw new Error("Invalid hex color (" + line + ")")
                    } else {
                        r = r[1] || r[0]
                    }

                    color = Color(parseInt(r, 16))
                } else {
                    await cleanColorRoles(msg.member)
                    msg.reply("I reset your color roles.")
                    return
                }
            } catch (e) {
                console.warn("Color parsing error: ", e)
                msg.reply("invalid color.")
                return
            }
        }

        if (!color) { msg.reply("invalid color."); return }

        await cleanColorRoles(msg.member)

        let role = msg.guild.roles.find(role => role.name.match("^" + color.hex()))

        if (!role) {
            role = await msg.guild.roles.create({
                data: {
                    name: color.hex(),
                    color: color.hex(),
                    permissions: [],
                    hoist: false
                }
            }).then(role => {
                let lowest = msg.guild.me.roles.filter(role => role.name !== "@everyone").sort((a, b) => b.position < a.position).array()[0].position
                role.setPosition(lowest - 1)
                return role
            })
        }

        msg.member.roles.add(role)

        let embed = new Discord.MessageEmbed()
            .setDescription(`<@${msg.author.id}>'s color is now <@&${role.id}>.`)
            .setColor(color.hex())

        msg.channel.send(embed)
    }, {
        help: "Set your username color using a role. Supported color formats are Hexadecimal and RGB. Call without arguments to reset your color.\nYou can also use your avatar's dominant color by passing `avatar` as the argument.",
        permissions: {
            bot: [ "MANAGE_ROLES" ]
        },
        guildOnly: true
    })

    bot.client.on("ready", function() {
        if (!this.user.bot) {
            bot.logger.warn("discord-color-roles", "User bot: with enough permissions, all color roles would have been cleaned.")
            return
        }

        this.setInterval(function() {
            cleanColorRoles()
        }, 60 * 60 * 1000)

        cleanColorRoles()
    })
}
