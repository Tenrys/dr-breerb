module.exports = class InvalidArgumentException extends Error {
    /**
     * @param {string} name The argument's name.
     * @param {string} type The expected type of the argument.
     */
    constructor(name, type) {
        this.name = "InvalidArgumentException"
        this.message = `'${name}' needs to be of type '${type}'`
    }
}
