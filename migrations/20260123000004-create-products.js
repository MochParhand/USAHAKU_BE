'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Products', {
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
            harga: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            harga_dasar: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            stok: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            },
            min_stok: {
                type: Sequelize.INTEGER,
                defaultValue: 5,
                allowNull: false
            },
            image: {
                type: Sequelize.STRING,
                allowNull: true
            },
            barcode: {
                type: Sequelize.STRING,
                allowNull: true
            },
            is_jasa: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            kategori_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
        await queryInterface.addIndex('Products', ['shop_id', 'updatedAt', 'is_deleted'], {
            name: 'idx_products_delta_sync'
        });
        await queryInterface.addIndex('Products', ['kategori_id'], {
            name: 'idx_products_kategori_id'
        });
        await queryInterface.addIndex('Products', ['barcode'], {
            name: 'idx_products_barcode'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Products');
    }
};
