import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Profile</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color={themedColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpApFXTCwbbmJOOSvLVNZh32l8sTojvUNrfQsZy6VmEcRdz_s-6QQ-hQeCi1R52b2D-fFR59YGJqDOxjZWIB5WqlE1Ikql_a9Vifq-YdlLkonz4WEEeNB76ipCSKWcGb-AzVLhcSc5gZSur8vYjd3pwxJIJ5-oPuo3Az1NA7AzTsCNEblIk9juhUnW3Jgh9GtKXpJyT8rTH5nM7QNf7xHCPOtZ6OjoFEgwx19LvrPXQMH7dOOEt-9NTx2x9O3cWfZqRDjdRS9MvpkU' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editButton}>
              <MaterialIcons name="edit" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: themedColors.text }]}>Jane Doe</Text>
          <Text style={[styles.userHandle, { color: themedColors.textSecondary }]}>@Jane.style</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themedColors.text }]}>152</Text>
            <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themedColors.text }]}>89</Text>
            <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Outfits</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <Text style={[styles.menuCardTitle, { color: themedColors.text }]}>Account</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="person-outline" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Edit Profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themedColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="lock-outline" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Change Password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themedColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <Text style={[styles.menuCardTitle, { color: themedColors.text }]}>Preferences</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="notifications-none" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themedColors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="dark-mode" size={24} color={themedColors.textSecondary} />
                <Text style={[styles.menuItemText, { color: themedColors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E7EB', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.menuCard, { backgroundColor: themedColors.card }]}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="logout" size={24} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
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
  moreButton: {
    position: 'absolute',
    right: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
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
});
