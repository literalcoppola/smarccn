const express = require('express');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Criar registro de compra (histórico)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { market_id, items, total_amount } = req.body;
    const userId = req.userId;

    if (!market_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Criar registro de compra
    const purchaseResult = await run(
      'INSERT INTO purchase_history (user_id, market_id, total_amount) VALUES (?, ?, ?)',
      [userId, market_id, total_amount]
    );

    const purchaseId = purchaseResult.id;

    // Adicionar itens da compra
    for (const item of items) {
      await run(
        'INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [purchaseId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({ 
      message: 'Compra registrada com sucesso',
      purchase_id: purchaseId 
    });
  } catch (error) {
    console.error('Erro ao registrar compra:', error);
    res.status(500).json({ error: 'Erro ao registrar compra' });
  }
});

// Listar histórico de compras do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const purchases = await all(
      `SELECT ph.*, m.name as market_name, m.address as market_address
       FROM purchase_history ph
       JOIN markets m ON ph.market_id = m.id
       WHERE ph.user_id = ?
       ORDER BY ph.purchase_date DESC`,
      [userId]
    );

    res.json({ purchases });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ error: 'Erro ao listar histórico' });
  }
});

// Buscar detalhes de uma compra específica
router.get('/:purchaseId', authMiddleware, async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.userId;

    const purchase = await get(
      `SELECT ph.*, m.name as market_name, m.address as market_address
       FROM purchase_history ph
       JOIN markets m ON ph.market_id = m.id
       WHERE ph.id = ? AND ph.user_id = ?`,
      [purchaseId, userId]
    );

    if (!purchase) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    const items = await all(
      `SELECT pi.*, p.name, p.brand, p.barcode, p.image_url
       FROM purchase_items pi
       JOIN products p ON pi.product_id = p.id
       WHERE pi.purchase_id = ?`,
      [purchaseId]
    );

    res.json({ purchase, items });
  } catch (error) {
    console.error('Erro ao buscar compra:', error);
    res.status(500).json({ error: 'Erro ao buscar compra' });
  }
});

// Estatísticas de gastos
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 'month' } = req.query; // month, week, year

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND purchase_date >= date('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "AND purchase_date >= date('now', '-30 days')";
    } else if (period === 'year') {
      dateFilter = "AND purchase_date >= date('now', '-365 days')";
    }

    const stats = await get(
      `SELECT 
         COUNT(*) as total_purchases,
         SUM(total_amount) as total_spent,
         AVG(total_amount) as average_purchase,
         MIN(total_amount) as min_purchase,
         MAX(total_amount) as max_purchase
       FROM purchase_history
       WHERE user_id = ? ${dateFilter}`,
      [userId]
    );

    res.json({ stats: stats || {} });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;