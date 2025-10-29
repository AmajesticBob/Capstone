import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';

export default function InspirationScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Inspiration</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.uploadCard, { backgroundColor: themedColors.card }]}>
          <Text style={[styles.uploadTitle, { color: themedColors.text }]}>Get Outfit Ideas</Text>
          <Text style={[styles.uploadDescription, { color: themedColors.textSecondary }]}>
            Upload a photo to find similar items from your closet and build an outfit.
          </Text>
          <View style={[styles.uploadArea, { borderColor: themedColors.border }]}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={48} color={themedColors.textSecondary} />
            <Text style={[styles.uploadLabel, { color: themedColors.text }]}>Upload Inspiration</Text>
            <Text style={[styles.uploadSubtext, { color: themedColors.textSecondary }]}>
              PNG, JPG, GIF up to 10MB
            </Text>
            <TouchableOpacity style={[styles.browseButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.browseButtonText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="image-search-outline" size={64} color={themedColors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: themedColors.text }]}>No Inspired Looks Yet</Text>
          <Text style={[styles.emptySubtitle, { color: themedColors.textSecondary }]}>
            Upload inspiration photos to see outfit suggestions
          </Text>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  uploadCard: {
    marginTop: 24,
    marginBottom: 32,
    padding: 24,
    borderRadius: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  browseButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
