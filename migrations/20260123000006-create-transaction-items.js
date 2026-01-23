'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('TransactionItems', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            transaction_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Transactions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            nama_barang: {
                type: Sequelize.STRING,
                allowNull: true
            },
            qty: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            harga: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            subtotal: {
                type: Sequelize.INTEGER,
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
        await queryInterface.addIndex('TransactionItems', ['transaction_id'], {
            name: 'idx_transaction_items_transaction_id'
        });
        await queryInterface.addIndex('TransactionItems', ['product_id'], {
            name: 'idx_transaction_items_product_id'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('TransactionItems');
    }
};
