const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../config/database');

const router = express.Router();

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, user_type, market_name, market_address } = req.body;

    // Validações
    if (!name || !email || !password || !user_type) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (!['customer', 'market'].includes(user_type)) {
      return res.status(400).json({ error: 'Tipo de usuário inválido' });
    }

    // Verificar se usuário já existe
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    let marketId = null;

    // Se for mercado, criar registro do mercado
    if (user_type === 'market') {
      if (!market_name || !market_address) {
        return res.status(400).json({ error: 'Nome e endereço do mercado são obrigatórios' });
      }

      try {
        const marketResult = await run(
          'INSERT INTO markets (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
          [market_name, market_address, -23.5505, -46.6333] // coordenadas padrão
        );
        marketId = marketResult.id;
      } catch (marketError) {
        console.error('Erro ao criar mercado:', marketError);
        return res.status(500).json({ error: 'Erro ao cadastrar mercado' });
      }
    }

    // Inserir usuário
    const result = await run(
      'INSERT INTO users (name, email, password, user_type, market_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, user_type, marketId]
    );

    // Gerar token
    const token = jwt.sign(
      { userId: result.id, userType: user_type, marketId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: { 
        id: result.id, 
        name, 
        email, 
        user_type,
        market_id: marketId 
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário: ' + error.message });
  }
});

// Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type, marketId: user.market_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        user_type: user.user_type,
        market_id: user.market_id
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

module.exports = router;