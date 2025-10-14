import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { getThemedColors } from '../theme';

const suggestions = {
  complementary: [
    { id: 1, name: 'Blue Sweater', color: '#60A5FA' },
  ],
  analogous: [
    { id: 2, name: 'Pink Blouse', color: '#FBCFE8' },
    { id: 3, name: 'Yellow Tee', color: '#FEF08A' },
  ],
  neutrals: [
    { id: 4, name: 'White Tee', color: '#FFFFFF' },
    { id: 5, name: 'Black Pants', color: '#1F2937' },
    { id: 6, name: 'Beige Top', color: '#E5E7EB' },
  ],
};

export default function PlannerScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Planner</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.subtitle, { color: themedColors.text }]}>
          Select an item to get color recommendations.
        </Text>

        <View style={styles.mainContent}>
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: themedColors.text }]}>Selected Item</Text>
            <View style={styles.selectedItem}>
              <Text style={styles.selectedItemText}>Orange Skirt</Text>
            </View>
          </View>

          <View style={styles.suggestionsSection}>
            <Text style={[styles.sectionTitle, { color: themedColors.text }]}>Smart Color Suggestions</Text>

            <View style={styles.suggestionGroup}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.colorDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={[styles.suggestionLabel, { color: themedColors.text }]}>Complementary</Text>
              </View>
              <View style={styles.itemsRow}>
                {suggestions.complementary.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.suggestionItem, { backgroundColor: item.color }]}
                  >
                    <Text style={[styles.itemText, { color: '#FFFFFF' }]}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.suggestionGroup}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.colorDot, { backgroundColor: '#FBCFE8' }]} />
                <Text style={[styles.suggestionLabel, { color: themedColors.text }]}>Analogous</Text>
              </View>
              <View style={styles.itemsRow}>
                {suggestions.analogous.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.suggestionItem, { backgroundColor: item.color }]}
                  >
                    <Text style={[styles.itemText, { color: item.color === '#FEF08A' ? '#111827' : '#111827' }]}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.suggestionGroup}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.colorDot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={[styles.suggestionLabel, { color: themedColors.text }]}>Neutrals</Text>
              </View>
              <View style={styles.itemsRow}>
                {suggestions.neutrals.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.suggestionItem, { backgroundColor: item.color }]}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        { color: item.color === '#FFFFFF' || item.color === '#E5E7EB' ? '#111827' : '#FFFFFF' },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  subtitle: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  mainContent: {
    paddingBottom: 24,
  },
  selectedSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedItem: {
    backgroundColor: '#FDBA74',
    borderRadius: 12,
    aspectRatio: 4/5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  selectedItemText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9A3412',
    textAlign: 'center',
  },
  suggestionsSection: {
    flex: 1,
  },
  suggestionGroup: {
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
