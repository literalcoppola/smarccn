import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './contexts/CartContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#4a6741' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="market/[id]" options={{ title: 'Produtos' }} />
          <Stack.Screen name="cart" options={{ title: 'Carrinho' }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}