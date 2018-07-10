module.exports = (sequelize, DataTypes) => {
    var RSSFeed = sequelize.define("RSSFeed", {
        server: DataTypes.BIGINT(10),
        channel: DataTypes.BIGINT(10),
        url: DataTypes.STRING(2048),
        lastFeedDate: DataTypes.DATE
    })

    return RSSFeed
}
