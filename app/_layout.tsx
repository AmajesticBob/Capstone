import { Stack } from 'expo-router';
import { ThemeProvider } from '../ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
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
  );
}
