'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Categories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            nama: {
                type: Sequelize.STRING,
                allowNull: false
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
            is_deleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
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

        // Add composite index for Delta Sync queries
        await queryInterface.addIndex('Categories', ['shop_id', 'updatedAt', 'is_deleted'], {
            name: 'idx_categories_delta_sync'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Categories');
    }
};
