const InvalidArgumentException = require("./InvalidArgumentException.js")

/**
 * A chat command to be used by a Discord user.
 */
module.exports = class Command {
    /**
     * @param {string} name The Command's name.
     * @param {function} callback The Command's callback.
     * @param {object} [options] Additional variables.
     */
    constructor(name, callback, options) {
        if (typeof name !== "string") { throw new InvalidArgumentException("name", "string") }
        if (typeof callback !== "function") { throw new InvalidArgumentException("callback", "function") }
        if (options !== undefined && typeof options !== "object") { throw new InvalidArgumentException("options", "object") }
        if (!options) { options = {} }

        this.name = name
        this.callback = callback
        this.help = options.help || "No information provided."
        this.guildOnly = options.guildOnly || false
        this.ownerOnly = options.ownerOnly || false
        this.aliases = options.aliases || []
        this.postRun = options.postRun
        this.permissions = options.permissions
    }
}
