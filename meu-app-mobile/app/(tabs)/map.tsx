import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MarketLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
}

export default function MapScreen() {
  const markets: MarketLocation[] = [
    {
      id: '1',
      name: 'Mercado da Esquina',
      address: 'Rua das Flores, 123',
      distance: '500m',
    },
    {
      id: '2',
      name: 'Supermercado Central',
      address: 'Av. Principal, 456',
      distance: '1.2km',
    },
    {
      id: '3',
      name: 'Mercadinho Bom Preço',
      address: 'Rua do Comércio, 789',
      distance: '800m',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={32} color="#4a6741" />
        <Text style={styles.headerTitle}>Mercados Próximos</Text>
      </View>

      <ScrollView style={styles.content}>
        {markets.map((market) => (
          <View key={market.id} style={styles.marketCard}>
            <View style={styles.marketIcon}>
              <Ionicons name="storefront" size={28} color="#4a6741" />
            </View>
            <View style={styles.marketInfo}>
              <Text style={styles.marketName}>{market.name}</Text>
              <Text style={styles.marketAddress}>{market.address}</Text>
              <View style={styles.distanceContainer}>
                <Ionicons name="navigate" size={16} color="#6b6b6b" />
                <Text style={styles.distance}>{market.distance} de você</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={48} color="#9ca3af" />
        <Text style={styles.placeholderText}>Mapa em breve</Text>
        <Text style={styles.placeholderSubtext}>
          Instalando dependências do Google Maps...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  marketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  marketAddress: {
    fontSize: 14,
    color: '#6b6b6b',
    marginBottom: 6,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 13,
    color: '#6b6b6b',
    marginLeft: 4,
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d2d2d',
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6b6b6b',
    marginTop: 4,
    textAlign: 'center',
  },
});