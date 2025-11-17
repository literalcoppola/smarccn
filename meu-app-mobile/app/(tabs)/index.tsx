import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { markets } from '../../services/data';
import { useCart } from '../contexts/CartContext';

export default function HomeScreen() {
  const { itemCount } = useCart();

  const renderMarket = ({ item }) => (
    <TouchableOpacity
      style={styles.marketCard}
      onPress={() => router.push(`/market/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.marketIcon}>
        <Ionicons name="storefront" size={24} color="#ffffff" />
      </View>
      <View style={styles.marketInfo}>
        <Text style={styles.marketName}>{item.name}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color="#6b6b6b" />
          <Text style={styles.marketAddress}>{item.address}</Text>
        </View>
        <View style={styles.distanceRow}>
          <Ionicons name="navigate-outline" size={12} color="#4a6741" />
          <Text style={styles.distance}>{item.distance}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4a6741" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Compacto */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cart" size={28} color="#ffffff" />
          <View>
            <Text style={styles.headerTitle}>SmartMarket</Text>
            <Text style={styles.headerSubtitle}>Olá, Letícia!</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart-outline" size={26} color="#ffffff" />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de Mercados */}
      <FlatList
        data={markets}
        renderItem={renderMarket}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Ionicons name="storefront" size={20} color="#4a6741" />
            <Text style={styles.listHeaderText}>Mercados Disponíveis</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4a6741',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a6741',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  marketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  marketIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a6741',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  marketAddress: {
    fontSize: 13,
    color: '#6b6b6b',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: '#4a6741',
    fontWeight: '600',
  },
});