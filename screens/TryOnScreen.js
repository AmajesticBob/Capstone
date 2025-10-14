import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';

const categories = {
  tops: [
    { id: 1, name: 'White Tee', selected: true },
    { id: 2, name: 'Green Shirt', selected: false },
    { id: 3, name: 'Blue Sweater', selected: false },
    { id: 4, name: 'Pink Blouse', selected: false },
  ],
  bottoms: [
    { id: 5, name: 'Blue Jeans', selected: true },
    { id: 6, name: 'Black Pants', selected: false },
    { id: 7, name: 'Orange Skirt', selected: false },
    { id: 8, name: 'Gray Shorts', selected: false },
  ],
  shoes: [
    { id: 9, name: 'White Shoes', selected: true },
    { id: 10, name: 'Brown Boots', selected: false },
    { id: 11, name: 'Black Heels', selected: false },
    { id: 12, name: 'Sneakers', selected: false },
  ],
};

export default function TryOnScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Virtual Try-On</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color={themedColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.modelContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIOuuK3imy2vlHcS1_k722fU-TAp4s1_1tVH951LM6JiFjQsHsiG4QrMWOyrycnqSF6UuHA9qG5YzvElsL5oPlgmF4ZhVS4M3f8jrR1tqZYYodIRsFtZpty4R6PoRBOntfekWjls-m6Ucm2XWrEV_5peclenC24wp9zLyU9u9rpSW6Y6L3CdMtPFefG4VsSN_B29i2nN0OoYcdS0-YXCr7AZN19sMO1wq9BnfUk_fBJpZBepmEGpDCENTtF-AkBaeJoDGj5mVRoh9R' }}
              style={styles.modelImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.overlayButton}>
                  <MaterialCommunityIcons name="creation" size={16} color="#FFFFFF" />
                  <Text style={styles.overlayButtonText}>AI Gen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.overlayButton}>
                  <MaterialIcons name="shuffle" size={16} color="#FFFFFF" />
                  <Text style={styles.overlayButtonText}>Shuffle</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.iconGroup}>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialIcons name="person" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {Object.entries(categories).map(([key, items]) => (
          <View key={key} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: themedColors.text }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.categoryItem,
                    { backgroundColor: themedColors.card, borderColor: item.selected ? colors.primary : 'transparent' },
                  ]}
                >
                  <Text style={[styles.categoryItemText, { color: themedColors.text }]}>{item.name}</Text>
                  {item.selected && (
                    <View style={styles.selectedBadge}>
                      <MaterialIcons name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
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
  shareButton: {
    position: 'absolute',
    right: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modelContainer: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
    backgroundColor: '#1F2937',
    width: 340, // Updated width as per instructions
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  overlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  iconGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryItem: {
    width: 96,
    height: 128,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  categoryItemText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
