const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../smartmarket.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Função para executar queries
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Função para buscar múltiplos registros
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Função para buscar um único registro
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Inicializar tabelas
const initialize = async () => {
  try {
    // Tabela de Usuários (com tipo: customer ou market)
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL DEFAULT 'customer',
        market_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (market_id) REFERENCES markets(id)
      )
    `);

    // Tabela de Mercados
    await run(`
      CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Produtos (agora sem código de barras obrigatório)
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        brand TEXT,
        category TEXT,
        unit TEXT DEFAULT 'un',
        image_url TEXT,
        created_by_market_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_market_id) REFERENCES markets(id)
      )
    `);

    // Tabela de Preços (produtos em mercados específicos) - agora com estoque
    await run(`
      CREATE TABLE IF NOT EXISTS product_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        market_id INTEGER NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (market_id) REFERENCES markets(id),
        UNIQUE(product_id, market_id)
      )
    `);

    // Tabela de Listas de Compras
    await run(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabela de Itens da Lista
    await run(`
      CREATE TABLE IF NOT EXISTS list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        checked BOOLEAN DEFAULT 0,
        FOREIGN KEY (list_id) REFERENCES shopping_lists(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Tabela de Histórico de Compras
    await run(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        market_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (market_id) REFERENCES markets(id)
      )
    `);

    // Tabela de Itens do Histórico
    await run(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchase_history(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Inserir mercados de exemplo
    const marketsCount = await get('SELECT COUNT(*) as count FROM markets');
    if (marketsCount.count === 0) {
      await run(`
        INSERT INTO markets (na me, address, latitude, longitude) VALUES
        ('Tauste Taubaté', 'R. Domingos Rodrigues do Prado, 99 - Vila Edmundo, Taubaté - SP', -23.5505, -46.6333),
        ('Carrefour Hipermercado', 'Av. Charles Schnneider, 1750 - Barranco, Taubaté - SP', -23.5515, -46.6343),
        ('Atacadão - Taubaté', 'Av. Dom Pedro I, 3060 - Jardim Baronesa, Taubaté - SP', -23.5495, -46.6323)
      `);

      // Inserir produtos de exemplo
      const categories = [
        { name: 'Arroz Branco 5kg', category: 'Alimentos Básicos', brand: 'Tio João', unit: 'kg' },
        { name: 'Feijão Preto 1kg', category: 'Alimentos Básicos', brand: 'Camil', unit: 'kg' },
        { name: 'Óleo de Soja 900ml', category: 'Óleos', brand: 'Liza', unit: 'ml' },
        { name: 'Açúcar Cristal 1kg', category: 'Alimentos Básicos', brand: 'União', unit: 'kg' },
        { name: 'Café Torrado 500g', category: 'Bebidas', brand: 'Pilão', unit: 'g' },
        { name: 'Leite Integral 1L', category: 'Laticínios', brand: 'Parmalat', unit: 'L' },
        { name: 'Pão de Forma', category: 'Padaria', brand: 'Pullman', unit: 'un' },
        { name: 'Macarrão Espaguete 500g', category: 'Massas', brand: 'Barilla', unit: 'g' },
        { name: 'Molho de Tomate 340g', category: 'Molhos', brand: 'Quero', unit: 'g' },
        { name: 'Refrigerante Cola 2L', category: 'Bebidas', brand: 'Coca-Cola', unit: 'L' },
        { name: 'Sabão em Pó 1kg', category: 'Limpeza', brand: 'Omo', unit: 'kg' },
        { name: 'Papel Higiênico 12 rolos', category: 'Higiene', brand: 'Neve', unit: 'un' }
      ];

      for (const product of categories) {
        await run(
          `INSERT INTO products (name, category, brand, unit) VALUES (?, ?, ?, ?)`,
          [product.name, product.category, product.brand, product.unit]
        );
      }

      // Inserir preços para cada produto em cada mercado
      for (let productId = 1; productId <= 12; productId++) {
        for (let marketId = 1; marketId <= 3; marketId++) {
          const basePrice = 5 + (productId * 2);
          const variation = (Math.random() * 3) - 1.5; // variação de ±1.5
          const price = (basePrice + variation).toFixed(2);
          const stock = Math.floor(Math.random() * 50) + 10;

          await run(
            `INSERT INTO product_prices (product_id, market_id, price, stock_quantity, is_available) 
             VALUES (?, ?, ?, ?, 1)`,
            [productId, marketId, price, stock]
          );
        }
      }
    }

    console.log('✅ Tabelas criadas/verificadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
};

module.exports = {
  db,
  run,
  all,
  get,
  initialize
};