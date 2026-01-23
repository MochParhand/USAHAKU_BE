'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('PurchaseItems', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            purchase_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Purchases',
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
            jumlah: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            harga_beli: {
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
        await queryInterface.addIndex('PurchaseItems', ['purchase_id'], {
            name: 'idx_purchase_items_purchase_id'
        });
        await queryInterface.addIndex('PurchaseItems', ['product_id'], {
            name: 'idx_purchase_items_product_id'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('PurchaseItems');
    }
};
