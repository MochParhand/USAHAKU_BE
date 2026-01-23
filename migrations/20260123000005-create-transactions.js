'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Transactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            tanggal: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            pelanggan_id: {
                type: Sequelize.STRING,
                allowNull: true
            },
            nama_pelanggan: {
                type: Sequelize.STRING,
                allowNull: true
            },
            total_bayar: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            bayar: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            kembalian: {
                type: Sequelize.INTEGER,
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

        // Add indexes for performance
        await queryInterface.addIndex('Transactions', ['shop_id', 'tanggal'], {
            name: 'idx_transactions_shop_date'
        });
        await queryInterface.addIndex('Transactions', ['shop_id', 'updatedAt', 'is_deleted'], {
            name: 'idx_transactions_delta_sync'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Transactions');
    }
};
