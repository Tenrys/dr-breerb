module.exports = (sequelize, DataTypes) => {
    var RSSFeed = sequelize.define("RSSFeed", {
        server: { type: DataTypes.STRING(22), allowNull: false },
        channel: { type: DataTypes.STRING(22), allowNull: false },
        url: { type: DataTypes.STRING(2048), allowNull: false },
        lastFeedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(1700, 1, 1)
        }
    })

    return RSSFeed
}
