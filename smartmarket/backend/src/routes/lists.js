const express = require('express');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Criar nova lista de compras
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ error: 'Nome da lista é obrigatório' });
    }

    const result = await run(
      'INSERT INTO shopping_lists (user_id, name) VALUES (?, ?)',
      [userId, name]
    );

    const list = await get('SELECT * FROM shopping_lists WHERE id = ?', [result.id]);
    res.status(201).json({ list });
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});

// Listar todas as listas do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const lists = await all(
      'SELECT * FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ lists });
  } catch (error) {
    console.error('Erro ao listar listas:', error);
    res.status(500).json({ error: 'Erro ao listar listas' });
  }
});

// Buscar uma lista específica com itens
router.get('/:listId', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.userId;

    const list = await get(
      'SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?',
      [listId, userId]
    );

    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }

    const items = await all(
      `SELECT li.*, p.name, p.brand, p.barcode, p.image_url
       FROM list_items li
       JOIN products p ON li.product_id = p.id
       WHERE li.list_id = ?`,
      [listId]
    );

    res.json({ list, items });
  } catch (error) {
    console.error('Erro ao buscar lista:', error);
    res.status(500).json({ error: 'Erro ao buscar lista' });
  }
});

// Adicionar item à lista
router.post('/:listId/items', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    // Verificar se item já existe na lista
    const existingItem = await get(
      'SELECT * FROM list_items WHERE list_id = ? AND product_id = ?',
      [listId, product_id]
    );

    if (existingItem) {
      // Atualiza quantidade
      await run(
        'UPDATE list_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existingItem.id]
      );
    } else {
      // Adiciona novo item
      await run(
        'INSERT INTO list_items (list_id, product_id, quantity) VALUES (?, ?, ?)',
        [listId, product_id, quantity]
      );
    }

    res.json({ message: 'Item adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// Marcar/desmarcar item como comprado
router.patch('/:listId/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { checked } = req.body;

    await run(
      'UPDATE list_items SET checked = ? WHERE id = ?',
      [checked ? 1 : 0, itemId]
    );

    res.json({ message: 'Item atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Remover item da lista
router.delete('/:listId/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    await run('DELETE FROM list_items WHERE id = ?', [itemId]);
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// Comparar preços da lista em diferentes mercados
router.get('/:listId/compare', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;

    // Buscar itens da lista
    const items = await all(
      'SELECT * FROM list_items WHERE list_id = ?',
      [listId]
    );

    if (items.length === 0) {
      return res.json({ markets: [] });
    }

    // Buscar todos os mercados
    const markets = await all('SELECT * FROM markets');

    // Calcular total para cada mercado
    const marketComparisons = await Promise.all(
      markets.map(async (market) => {
        let total = 0;
        let availableItems = 0;

        for (const item of items) {
          const price = await get(
            'SELECT price FROM product_prices WHERE product_id = ? AND market_id = ?',
            [item.product_id, market.id]
          );

          if (price) {
            total += price.price * item.quantity;
            availableItems++;
          }
        }

        return {
          market_id: market.id,
          market_name: market.name,
          market_address: market.address,
          total,
          available_items: availableItems,
          total_items: items.length
        };
      })
    );

    // Ordenar por preço total
    marketComparisons.sort((a, b) => a.total - b.total);

    res.json({ markets: marketComparisons });
  } catch (error) {
    console.error('Erro ao comparar preços:', error);
    res.status(500).json({ error: 'Erro ao comparar preços' });
  }
});

// Deletar lista
router.delete('/:listId', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.userId;

    // Verificar se a lista pertence ao usuário
    const list = await get(
      'SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?',
      [listId, userId]
    );

    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }

    // Deletar itens da lista
    await run('DELETE FROM list_items WHERE list_id = ?', [listId]);
    
    // Deletar lista
    await run('DELETE FROM shopping_lists WHERE id = ?', [listId]);

    res.json({ message: 'Lista deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar lista:', error);
    res.status(500).json({ error: 'Erro ao deletar lista' });
  }
});

module.exports = router;