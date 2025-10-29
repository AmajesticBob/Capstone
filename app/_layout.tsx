import { Stack } from 'expo-router';
import { ThemeProvider } from '../ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="add-item" 
            options={{ 
              presentation: 'modal',
              headerShown: false
            }} 
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
