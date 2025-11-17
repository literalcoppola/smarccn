export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  marketId: string;
  image?: string;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  distance: string;
  latitude: number;
  longitude: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: string[];
  createdAt: Date;
}

export const markets: Market[] = [
  {
    id: '1',
    name: 'Mercado da Esquina',
    address: 'Rua das Flores, 123',
    distance: '500m',
    latitude: -23.013104,
    longitude: -45.555939,
  },
  {
    id: '2',
    name: 'Supermercado Central',
    address: 'Av. Principal, 456',
    distance: '1.2km',
    latitude: -23.015000,
    longitude: -45.560000,
  },
  {
    id: '3',
    name: 'Mercadinho Bom Preço',
    address: 'Rua do Comércio, 789',
    distance: '800m',
    latitude: -23.010000,
    longitude: -45.550000,
  },
];

export const products: Product[] = [
  // Mercado da Esquina
  { id: '1', name: 'Arroz 5kg', price: 25.90, category: 'Grãos', marketId: '1' },
  { id: '2', name: 'Feijão 1kg', price: 8.50, category: 'Grãos', marketId: '1' },
  { id: '3', name: 'Óleo de Soja 900ml', price: 7.20, category: 'Óleos', marketId: '1' },
  { id: '4', name: 'Açúcar 1kg', price: 4.50, category: 'Grãos', marketId: '1' },
  { id: '5', name: 'Café 500g', price: 15.90, category: 'Bebidas', marketId: '1' },
  
  // Supermercado Central
  { id: '6', name: 'Arroz 5kg', price: 24.50, category: 'Grãos', marketId: '2' },
  { id: '7', name: 'Feijão 1kg', price: 9.00, category: 'Grãos', marketId: '2' },
  { id: '8', name: 'Macarrão 500g', price: 3.80, category: 'Massas', marketId: '2' },
  { id: '9', name: 'Molho de Tomate', price: 2.50, category: 'Molhos', marketId: '2' },
  { id: '10', name: 'Leite 1L', price: 4.90, category: 'Laticínios', marketId: '2' },
  
  // Mercadinho Bom Preço
  { id: '11', name: 'Arroz 5kg', price: 23.90, category: 'Grãos', marketId: '3' },
  { id: '12', name: 'Feijão 1kg', price: 7.90, category: 'Grãos', marketId: '3' },
  { id: '13', name: 'Sal 1kg', price: 1.50, category: 'Temperos', marketId: '3' },
  { id: '14', name: 'Farinha de Trigo 1kg', price: 5.20, category: 'Grãos', marketId: '3' },
  { id: '15', name: 'Biscoito Cream Cracker', price: 3.50, category: 'Biscoitos', marketId: '3' },
];

export const getProductsByMarket = (marketId: string): Product[] => {
  return products.filter(p => p.marketId === marketId);
};

export const searchProducts = (query: string): Product[] => {
  return products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  );
};