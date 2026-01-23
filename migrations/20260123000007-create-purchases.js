'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Purchases', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            tanggal: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            supplier: {
                type: Sequelize.STRING,
                allowNull: true
            },
            total_biaya: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            keterangan: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            shop_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Shops',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add index for date-range queries
        await queryInterface.addIndex('Purchases', ['shop_id', 'tanggal'], {
            name: 'idx_purchases_shop_date'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Purchases');
    }
};
