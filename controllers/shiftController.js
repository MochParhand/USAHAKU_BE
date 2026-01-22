const Shift = require('../models/Shift');
const Transaction = require('../models/Transaction'); // Assuming this exists to calc expected cash
const { Op } = require('sequelize');

console.log(">>> LOADED SHIFT CONTROLLER (total_bayar FIX) <<<");

exports.openShift = async (req, res) => {
    try {
        const { initialCash, shopId: bodyShopId } = req.body;
        const userId = req.user.id;
        // Fix: Token stores 'shop_id', but frontend might send 'shopId' in body
        const shopId = req.user.shop_id || req.user.shopId || bodyShopId; 

        if (!shopId) {
            console.error("Open Shift Error: shopId not found in user token or body", req.user);
            return res.status(400).json({ error: "Data toko tidak valid. Silakan login ulang." });
        }

        // Check if there is already an open shift for this user
        const existingShift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (existingShift) {
            return res.status(400).json({ error: "Anda masih memiliki shift yang terbuka." });
        }

        const newShift = await Shift.create({
            userId,
            shopId,
            initialCash: initialCash || 0,
            startTime: new Date(),
            status: 'open'
        });

        res.status(201).json(newShift);
    } catch (error) {
        console.error("Error opening shift:", error);
        res.status(500).json({ error: "Gagal membuka kasir: " + error.message });
    }
};

exports.closeShift = async (req, res) => {
    try {
        const { finalCash } = req.body; // Actual cash in drawer
        const userId = req.user.id;
        
        const currentShift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (!currentShift) {
            return res.status(404).json({ error: "Tidak ada shift aktif." });
        }

        // Calculate total sales during this shift
        // Use 'total_bayar' and 'tanggal' as per Transaction model
        // Filter by shop_id instead of userId as Transaction doesn't have userId yet
        // Create endTime here
        const endTime = new Date();

        const shop_id = req.user.shop_id;

        const totalSales = await Transaction.sum('total_bayar', {
            where: {
                shop_id: shop_id, 
                tanggal: {
                    [Op.gte]: currentShift.startTime,
                    [Op.lte]: endTime
                }
            }
        }) || 0;

        const expectedCash = parseFloat(currentShift.initialCash) + parseFloat(totalSales);

        await currentShift.update({
            endTime: endTime,
            finalCash: finalCash,
            expectedCash: expectedCash,
            status: 'closed'
        });

        res.json({
            message: "Shift ditutup.",
            data: {
                start: currentShift.startTime,
                end: endTime,
                initial: currentShift.initialCash,
                sales: totalSales,
                expected: expectedCash,
                actual: finalCash,
                difference: parseFloat(finalCash) - expectedCash
            }
        });

    } catch (error) {
        console.error("Error closing shift:", error);
        res.status(500).json({ error: "Gagal menutup kasir." });
    }
};

exports.getShiftSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentShift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (!currentShift) {
            return res.status(404).json({ error: "Tidak ada shift aktif." });
        }

        const endTime = new Date();
        
        // Calculate Sales
        // Use 'total_bayar' and 'tanggal' per Transaction model
        const shop_id = req.user.shop_id;
        
        const totalSales = await Transaction.sum('total_bayar', {
            where: {
                shop_id: shop_id,
                tanggal: {
                    [Op.gte]: currentShift.startTime,
                    [Op.lte]: endTime
                }
            }
        }) || 0;

        const expectedCash = parseFloat(currentShift.initialCash) + parseFloat(totalSales);

        res.json({
            shiftId: currentShift.id,
            startTime: currentShift.startTime,
            initialCash: parseFloat(currentShift.initialCash),
            totalSales: parseFloat(totalSales),
            expectedCash: expectedCash
        });

    } catch (error) {
        console.error("Error getting shift summary:", error);
        res.status(500).json({ error: "Gagal memuat ringkasan shift." });
    }
};

exports.getCurrentShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentShift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (!currentShift) {
            return res.status(200).json(null); // No open shift
        }

        res.json(currentShift);
    } catch (error) {
        console.error("Error getting shift:", error);
        res.status(500).json({ error: "Gagal memuat status shift." });
    }
};
