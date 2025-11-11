const express = require('express');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar todos os produtos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY category, name');
    res.json({ products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Buscar produtos por categoria
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const products = await all(
      'SELECT * FROM products WHERE category = ? ORDER BY name',
      [category]
    );
    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Listar todas as categorias
router.get('/categories/all', authMiddleware, async (req, res) => {
  try {
    const categories = await all(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Buscar produtos por nome
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    const products = await all(
      'SELECT * FROM products WHERE name LIKE ? OR brand LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    );
    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Criar novo produto (apenas mercados)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, brand, category, unit, image_url, price, stock_quantity } = req.body;
    const userId = req.userId;

    // Verificar se usuário é um mercado
    const user = await get('SELECT user_type, market_id FROM users WHERE id = ?', [userId]);
    
    if (!user || user.user_type !== 'market') {
      return res.status(403).json({ error: 'Apenas mercados podem criar produtos' });
    }

    if (!name || !category) {
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }

    // Criar produto
    const productResult = await run(
      `INSERT INTO products (name, description, brand, category, unit, image_url, created_by_market_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', brand || '', category, unit || 'un', image_url || null, user.market_id]
    );

    // Se forneceu preço e estoque, adicionar à tabela de preços
    if (price !== undefined) {
      await run(
        `INSERT INTO product_prices (product_id, market_id, price, stock_quantity, is_available) 
         VALUES (?, ?, ?, ?, 1)`,
        [productResult.id, user.market_id, price, stock_quantity || 0]
      );
    }

    const product = await get('SELECT * FROM products WHERE id = ?', [productResult.id]);
    res.status(201).json({ product });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto (apenas o mercado que criou)
router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, brand, category, unit, image_url } = req.body;
    const userId = req.userId;

    const user = await get('SELECT user_type, market_id FROM users WHERE id = ?', [userId]);
    
    if (!user || user.user_type !== 'market') {
      return res.status(403).json({ error: 'Apenas mercados podem atualizar produtos' });
    }

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (product.created_by_market_id !== user.market_id) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar este produto' });
    }

    await run(
      `UPDATE products SET name = ?, description = ?, brand = ?, category = ?, unit = ?, image_url = ? 
       WHERE id = ?`,
      [name, description, brand, category, unit, image_url, productId]
    );

    const updatedProduct = await get('SELECT * FROM products WHERE id = ?', [productId]);
    res.json({ product: updatedProduct });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Listar produtos de um mercado específico com preços
router.get('/market/:marketId', authMiddleware, async (req, res) => {
  try {
    const { marketId } = req.params;
    
    const productsWithPrices = await all(
      `SELECT p.*, pp.price, pp.stock_quantity, pp.is_available, pp.id as price_id
       FROM products p
       INNER JOIN product_prices pp ON p.id = pp.product_id
       WHERE pp.market_id = ? AND pp.is_available = 1
       ORDER BY p.category, p.name`,
      [marketId]
    );

    res.json({ products: productsWithPrices });
  } catch (error) {
    console.error('Erro ao listar produtos do mercado:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Adicionar/Atualizar preço de produto em um mercado
router.post('/price', authMiddleware, async (req, res) => {
  try {
    const { product_id, price, stock_quantity, is_available } = req.body;
    const userId = req.userId;

    const user = await get('SELECT user_type, market_id FROM users WHERE id = ?', [userId]);
    
    if (!user || user.user_type !== 'market') {
      return res.status(403).json({ error: 'Apenas mercados podem gerenciar preços' });
    }

    if (!product_id || price === undefined) {
      return res.status(400).json({ error: 'ID do produto e preço são obrigatórios' });
    }

    // Verifica se já existe preço para este produto neste mercado
    const existingPrice = await get(
      'SELECT * FROM product_prices WHERE product_id = ? AND market_id = ?',
      [product_id, user.market_id]
    );

    if (existingPrice) {
      // Atualiza o preço
      await run(
        `UPDATE product_prices 
         SET price = ?, stock_quantity = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [price, stock_quantity || 0, is_available !== undefined ? is_available : 1, existingPrice.id]
      );
    } else {
      // Insere novo preço
      await run(
        `INSERT INTO product_prices (product_id, market_id, price, stock_quantity, is_available) 
         VALUES (?, ?, ?, ?, ?)`,
        [product_id, user.market_id, price, stock_quantity || 0, is_available !== undefined ? is_available : 1]
      );
    }

    res.json({ message: 'Preço atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// Buscar preços de um produto em todos os mercados
router.get('/:productId/prices', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const prices = await all(
      `SELECT pp.*, m.name as market_name, m.address 
       FROM product_prices pp
       JOIN markets m ON pp.market_id = m.id
       WHERE pp.product_id = ? AND pp.is_available = 1
       ORDER BY pp.price ASC`,
      [productId]
    );

    res.json({ prices });
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

module.exports = router;