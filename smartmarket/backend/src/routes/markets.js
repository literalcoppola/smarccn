const express = require('express');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Função: Calcular distância entre dois pontos (Fórmula de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distância em km
};

// Listar todos os mercados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const markets = await all('SELECT * FROM markets');
    res.json({ markets });
  } catch (error) {
    console.error('Erro ao listar mercados:', error);
    res.status(500).json({ error: 'Erro ao listar mercados' });
  }
});

// Buscar mercados próximos (com cálculo de distância)
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }

    const markets = await all('SELECT * FROM markets');
    
    const marketsWithDistance = markets.map(market => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        market.latitude,
        market.longitude
      );

      return { 
        ...market, 
        distance: parseFloat(distance.toFixed(2))
      };
    }).filter(m => m.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json({ markets: marketsWithDistance });
  } catch (error) {
    console.error('Erro ao buscar mercados próximos:', error);
    res.status(500).json({ error: 'Erro ao buscar mercados próximos' });
  }
});

// Adicionar novo mercado
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Nome e endereço são obrigatórios' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }

    const result = await run(
      'INSERT INTO markets (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, parseFloat(latitude), parseFloat(longitude)]
    );

    const market = await get('SELECT * FROM markets WHERE id = ?', [result.id]);
    res.status(201).json({ market });
  } catch (error) {
    console.error('Erro ao adicionar mercado:', error);
    res.status(500).json({ 
      error: 'Erro ao adicionar mercado',
      message: error.message
    });
  }
});

module.exports = router;