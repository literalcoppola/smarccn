require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/database');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const productsRoutes = require('./src/routes/products');
const listsRoutes = require('./src/routes/lists');
const marketsRoutes = require('./src/routes/markets');
const historyRoutes = require('./src/routes/history');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/history', historyRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'SmartMarket API está funcionando!' });
});

// Inicializar banco de dados e servidor
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Banco de dados SQLite inicializado com sucesso`);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  });