const Command = require("@commands/Command.js")

const Discord = require("@extensions/discord.js")

const Color = require("color")
const Vibrant = require("node-vibrant")

module.exports = class ColorCommand extends Command {
    constructor(bot) {
        super(bot)

        this.description = "Set your username color using a role. Supported color formats are Hexadecimal and RGB. Call without arguments to reset your color.\nYou can also use your avatar's dominant color by passing `avatar` as the argument."
        this.permissions = {
            bot: [ "MANAGE_ROLES" ]
        }
        this.guildOnly = true

        /**
         * If provided a member, will clean that member's roles with name starting with "#".
         * Otherwise, will clean every guild's roles with name starting with "#" if they have no members.
         * @param {Discord.Member} [member]
         */
        bot.cleanColorRoles = async function(member) {
            if (member) {
                if (member.guild.me.hasPermission("MANAGE_ROLES")) {
                    await member.roles.filter(role => role.name.match("^#")).every(role => member.roles.remove(role))
                }
            } else {
                await this.client.guilds.filter(guild => guild.me.hasPermission("MANAGE_ROLES")).every(guild => {
                    guild.roles.filter(role => role.name.match("^#") && role.members.array().length < 1).every(role => role.delete())
                })
            }
        }

        bot.client.on("ready", () => {
            if (!bot.client.user.bot) {
                bot.logger.warn("discord-color-roles", "User bot: with enough permissions, all color roles would have been cleaned.")
                return
            }

            bot.cleanColorRoles()

            bot.client.setInterval(bot.cleanColorRoles.bind(bot), 60 * 60 * 1000)
        })
    }

    async callback(msg, line, r, g, b) {
        line = line.toLowerCase()
        r = r || line

        let color
        if (line === "avatar") {
            let palette = await Vibrant.from(msg.author.avatarURL({ format: "png" })).getPalette()
            let dominant =  palette.Vibrant ||
                            palette.LightVibrant ||
                            palette.LightMuted ||
                            palette.DarkVibrant ||
                            palette.DarkMuted ||
                            palette.Muted
            color = Color(dominant.getHex())
        } else if (line.trim() === "") { // CLEANUP
            await this.bot.cleanColorRoles(msg.member)
            msg.reply(this.success("Color roles reset."))
            return
        } else {
            try {
                if (r !== undefined && g !== undefined && b !== undefined) { // RGB
                    r = parseInt(r, 10)
                    g = parseInt(g, 10)
                    b = parseInt(b, 10)
                    if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error("RGB value is NaN")

                    color = Color.rgb(r, g, b)
                } else if (r !== undefined && (g === undefined || b === undefined)) { // HEX
                    r = /^#?([a-fA-F0-9_]+)/.exec(r)
                    if (r !== null && r !== undefined) r = r[1] || r[0]
                    else throw new Error("Invalid hex color (" + line + ")")

                    color = Color(parseInt(r, 16))
                }
            } catch (err) {
                msg.reply(this.error("Invalid color."))
                this.bot.logger.warn("discord-color-roles", "Color parsing error: " + err.stack || err)
                return
            }
        }

        if (!color) { msg.reply(this.error("Invalid color.")); return }

        await this.bot.cleanColorRoles(msg.member)

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

        msg.reply(this.success(`<@${msg.author.id}>'s color is now <@&${role.id}>.`, null, color.hex()))
    }
}
