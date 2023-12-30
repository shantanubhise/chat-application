const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('chatapp', 'postgres', '12345678', {
    host: 'localhost',
    dialect: 'postgres',
    // logging: true, // Set to true if you want to see SQL queries in the console
    logging: console.log, 

  });

module.exports = sequelize;
