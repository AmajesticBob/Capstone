import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import { USERNAME_REGEX } from '../../constants/validation';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, checkUsernameAvailability } = useAuth();
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSave = async () => {
    setError('');

    if (!username) {
      setError('Username is required');
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setError('Username must be 3-15 characters (letters, numbers, underscore)');
      return;
    }

    // Check if username changed and if it's available
    if (username !== profile?.username) {
      setChecking(true);
      const isAvailable = await checkUsernameAvailability(username);
      setChecking(false);

      if (!isAvailable) {
        setError('Username is already taken');
        return;
      }
    }

    setLoading(true);

    try {
      await updateProfile({ username: username.trim() });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={themedColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: themedColors.text }]}>Username</Text>
          <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
            <MaterialIcons name="person" size={20} color={themedColors.textSecondary} />
            <TextInput
              style={[styles.input, { color: themedColors.text, backgroundColor: 'transparent' }]}
              placeholder="Enter username"
              placeholderTextColor={themedColors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              textContentType="username"
            />
            {checking && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: themedColors.text }]}>Email</Text>
          <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border, opacity: 0.6 }]}>
            <MaterialIcons name="email" size={20} color={themedColors.textSecondary} />
            <TextInput
              style={[styles.input, { color: themedColors.text }]}
              value={profile?.email}
              editable={false}
            />
            <MaterialIcons name="lock" size={16} color={themedColors.textSecondary} />
          </View>
          <Text style={[styles.helperText, { color: themedColors.textSecondary }]}>
            Email cannot be changed
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading || checking}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    letterSpacing: 0,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
