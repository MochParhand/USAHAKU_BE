'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Shifts', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            shopId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            startTime: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            endTime: {
                type: Sequelize.DATE,
                allowNull: true
            },
            initialCash: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
                allowNull: false
            },
            finalCash: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true
            },
            expectedCash: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('open', 'closed'),
                defaultValue: 'open',
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

        // Add indexes for performance
        await queryInterface.addIndex('Shifts', ['shopId', 'status'], {
            name: 'idx_shifts_shop_status'
        });
        await queryInterface.addIndex('Shifts', ['userId'], {
            name: 'idx_shifts_user_id'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Shifts');
    }
};
