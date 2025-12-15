import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, deleteAccount } = useAuth();
  const { isDark, toggleTheme, syncWithSystem, toggleSyncWithSystem } = useTheme();
  const themedColors = getThemedColors(isDark);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)/login');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: themedColors.text }]}>
            {profile?.username || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: themedColors.textSecondary }]}>
            {profile?.email || ''}
          </Text>
        </View>

        <View style={styles.menuSection}>
          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <Text style={[styles.menuCardTitle, { color: themedColors.text }]}>Account</Text>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(profile)/edit-profile')}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="person-outline" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Edit Profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themedColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(profile)/change-password')}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="lock-outline" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Change Password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themedColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <Text style={[styles.menuCardTitle, { color: themedColors.text }]}>Preferences</Text>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="brightness-auto" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Sync Theme with System</Text>
              </View>
              <Switch
                value={syncWithSystem}
                onValueChange={toggleSyncWithSystem}
                trackColor={{ false: '#E5E7EB', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.menuItem, !syncWithSystem && styles.menuItemEnabled]}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="dark-mode" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                disabled={syncWithSystem}
                trackColor={{ false: '#E5E7EB', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="logout" size={24} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="delete-forever" size={24} color="#DC2626" />
                <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Delete Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 30
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemEnabled: {
    opacity: 1,
  },
});
