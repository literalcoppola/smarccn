const express = require('express');
const axios = require('axios');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Buscar produto por código de barras (API Externa - Datakick/GTINSearch)
router.get('/barcode/:barcode', authMiddleware, async (req, res) => {
  try {
    const { barcode } = req.params;

    // Validar código de barras (deve ter 13 dígitos para EAN-13)
    if (!/^\d{8,14}$/.test(barcode)) {
      return res.status(400).json({ error: 'Código de barras inválido. Use 8-14 dígitos.' });
    }

    // Primeiro verifica se o produto já está no banco local
    const localProduct = await get(
      'SELECT * FROM products WHERE barcode = ?',
      [barcode]
    );

    if (localProduct) {
      return res.json({
        source: 'local',
        product: localProduct
      });
    }

    // Preencher com zeros à esquerda se necessário (EAN-13 padrão)
    const paddedBarcode = barcode.padStart(13, '0');

    // Buscar na API Datakick (GTINSearch)
    const response = await axios.get(
      `https://www.gtinsearch.org/api/items/${paddedBarcode}`,
      {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.data || response.data.error) {
      return res.status(404).json({ 
        error: 'Produto não encontrado na base de dados',
        message: 'Tente outro código de barras ou cadastre o produto manualmente'
      });
    }

    const apiProduct = response.data;

    // Extrair informações da API
    const productName = apiProduct.name || apiProduct.title || 'Produto sem nome';
    const productBrand = apiProduct.brand || apiProduct.manufacturer || 'Marca desconhecida';
    const productCategory = apiProduct.category || 'Geral';
    const productImage = apiProduct.image_url || apiProduct.images?.[0] || null;

    // Salvar produto no banco local
    const result = await run(
      `INSERT INTO products (barcode, name, brand, category, image_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        barcode,
        productName,
        productBrand,
        productCategory,
        productImage
      ]
    );

    const savedProduct = await get('SELECT * FROM products WHERE id = ?', [result.id]);

    res.json({
      source: 'api',
      product: savedProduct,
      apiData: {
        name: productName,
        brand: productBrand,
        category: productCategory,
        image: productImage
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    
    // Se a API falhou, retorna erro mais amigável
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: 'Serviço de busca de produtos temporariamente indisponível',
        message: 'Tente novamente em alguns instantes'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao buscar produto',
      message: 'Verifique o código de barras e tente novamente'
    });
  }
});

// Listar todos os produtos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Buscar produtos por nome
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    const products = await all(
      'SELECT * FROM products WHERE name LIKE ? OR brand LIKE ?',
      [`%${query}%`, `%${query}%`]
    );
    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Adicionar/Atualizar preço de produto em um mercado
router.post('/price', authMiddleware, async (req, res) => {
  try {
    const { product_id, market_id, price } = req.body;

    if (!product_id || !market_id || !price) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verifica se já existe preço para este produto neste mercado
    const existingPrice = await get(
      'SELECT * FROM product_prices WHERE product_id = ? AND market_id = ?',
      [product_id, market_id]
    );

    if (existingPrice) {
      // Atualiza o preço
      await run(
        'UPDATE product_prices SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [price, existingPrice.id]
      );
    } else {
      // Insere novo preço
      await run(
        'INSERT INTO product_prices (product_id, market_id, price) VALUES (?, ?, ?)',
        [product_id, market_id, price]
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
       WHERE pp.product_id = ?
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