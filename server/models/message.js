const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize.js');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false, // Disable timestamps
});

module.exports = Message;
