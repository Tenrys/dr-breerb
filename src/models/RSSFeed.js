module.exports = (sequelize, DataTypes) => {
    var RSSFeed = sequelize.define("RSSFeed", {
        guild: { type: DataTypes.STRING(22), allowNull: false },
        channel: { type: DataTypes.STRING(22), allowNull: false },
        url: { type: DataTypes.STRING(2048), allowNull: false },
        lastFeedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(1700, 1, 1)
        },
        valid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    })

    return RSSFeed
}
