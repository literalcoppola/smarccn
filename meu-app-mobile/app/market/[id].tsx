import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { markets, getProductsByMarket, Product } from '../../services/data';
import { useCart } from '../contexts/CartContext';

export default function MarketScreen() {
  const { id } = useLocalSearchParams();
  const { addToCart, itemCount } = useCart();
  
  const market = markets.find(m => m.id === id);
  const products = getProductsByMarket(id as string);

  if (!market) {
    return (
      <View style={styles.container}>
        <Text>Mercado não encontrado</Text>
      </View>
    );
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    Alert.alert('Sucesso!', `${product.name} adicionado ao carrinho`);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>
          R$ {item.price.toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.marketHeader}>
        <View style={styles.marketIconLarge}>
          <Ionicons name="storefront" size={32} color="#ffffff" />
        </View>
        <Text style={styles.marketName}>{market.name}</Text>
        <Text style={styles.marketAddress}>{market.address}</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productList}
        ListHeaderComponent={
          <Text style={styles.listHeader}>Produtos Disponíveis</Text>
        }
      />

      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartFloating}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart" size={24} color="#ffffff" />
          <Text style={styles.cartText}>Ver Carrinho ({itemCount})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  marketHeader: {
    backgroundColor: '#4a6741',
    padding: 20,
    alignItems: 'center',
  },
  marketIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3d5536',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  marketAddress: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  productList: {
    padding: 16,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6b6b6b',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6741',
  },
  addButton: {
    backgroundColor: '#4a6741',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartFloating: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});