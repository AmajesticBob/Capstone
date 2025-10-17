import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';

const closetItems = [
  { id: 1, name: 'White Tee', category: 'top', color: '#FFFFFF' },
  { id: 2, name: 'Blue Jeans', category: 'bottom', color: '#93C5FD' },
  { id: 3, name: 'White Shoes', category: 'shoe', color: '#FEF08A' },
  { id: 4, name: 'Green Shirt', category: 'top', color: '#86EFAC' },
  { id: 5, name: 'Blue Sweater', category: 'top', color: '#60A5FA' },
  { id: 6, name: 'Black Pants', category: 'bottom', color: '#1F2937' },
  { id: 7, name: 'Brown Boots', category: 'shoe', color: '#6B7280' },
  { id: 8, name: 'Orange Skirt', category: 'bottom', color: '#FDBA74' },
  { id: 9, name: 'Pink Blouse', category: 'top', color: '#FBCFE8' },
];

export default function ClosetScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Tops', value: 'top' },
    { label: 'Bottoms', value: 'bottom' },
    { label: 'Shoes', value: 'shoe' },
  ];

  const filteredItems = selectedFilter === 'all'
    ? closetItems
    : closetItems.filter(item => item.category === selectedFilter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>My Closet</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.value
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: themedColors.card },
                ]}
                onPress={() => setSelectedFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter.value
                      ? { color: '#FFFFFF' }
                      : { color: themedColors.text },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/add-item')}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.gridItem,
                { backgroundColor: item.color, borderColor: themedColors.border },
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  { color: item.color === '#FFFFFF' || item.color === '#FEF08A' || item.color === '#FBCFE8' ? '#111827' : '#FFFFFF' },
                ]}
              >
                {item.name}
              </Text>
            </View>
          ))}
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
