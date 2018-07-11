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

    let title = ":paintbrush: Colors"

    category.addCommand("color", async (msg, line, r, g, b) => {
        if (!msg.member) { msg.error("Webhooks are unsupported.", title); return } // Could also be trying to use userbot as bot, that shit doesn't work for some reason lol

        line = line.toLowerCase()
        r = r || line

        let color
        if (line === "avatar") {
            let img = await Jimp.read(msg.author.avatarURL({ format: "png" }))
            let dominant = ColorThief.getColor(img)
            color = Color({ r: dominant[0], g: dominant[1], b: dominant[2] })
        } else {
            try {
                if (r !== undefined && g !== undefined && b !== undefined) { // RGB
                    r = parseInt(r, 10)
                    g = parseInt(g, 10)
                    b = parseInt(b, 10)
                    if (isNaN(r) || isNaN(g) || isNaN(b)) {
                        throw new Error("RGB value is NaN")
                    }

                    color = Color.rgb(r, g, b)
                } else if (r !== undefined && (g === undefined || b === undefined)) { // HEX
                    r = /^#?([a-fA-F0-9_]+)/.exec(r)
                    if (!r) {
                        throw new Error("Invalid hex color (" + line + ")")
                    } else {
                        r = r[1] || r[0]
                    }

                    color = Color(parseInt(r, 16))
                } else { // CLEANUP
                    await cleanColorRoles(msg.member)
                    msg.success("I reset your color roles.", title)
                    return
                }
            } catch (err) {
                msg.error("Invalid color.", title)
                bot.logger.warn("discord-color-roles", "Color parsing error: " + err.stack || err)
                return
            }
        }

        if (!color) { msg.error("Invalid color.", title); return }

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

        msg.success(`<@${msg.author.id}>'s color is now <@&${role.id}>.`, title, color.hex())
    }, {
        help: "Set your username color using a role. Supported color formats are Hexadecimal and RGB. Call without arguments to reset your color.\nYou can also use your avatar's dominant color by passing `avatar` as the argument.",
        permissions: {
            bot: [ "MANAGE_ROLES" ]
        },
        guildOnly: true
    })

    bot.client.on("ready", () => {
        if (!bot.client.user.bot) {
            bot.logger.warn("discord-color-roles", "User bot: with enough permissions, all color roles would have been cleaned.")
            return
        }

        cleanColorRoles()

        bot.client.setInterval(() => {
            cleanColorRoles()
        }, 60 * 60 * 1000)
    })
}
