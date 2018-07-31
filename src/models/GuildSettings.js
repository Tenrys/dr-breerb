module.exports = (sequelize, DataTypes) => {
    var GuildSettings = sequelize.define("GuildSettings", {
        guild: { type: DataTypes.STRING(22), allowNull: false },
        prefix: { type: DataTypes.STRING(5), defaultValue: "!" }
    })

    return GuildSettings
}
