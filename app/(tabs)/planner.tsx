import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { getThemedColors } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
// ADDED: getSignedImageUrl import
import { getUserItems, getSignedImageUrl } from '../../lib/items';
import { Item } from '../../types/items';

// --- Color Theory Helpers ---

// Convert Hex to HSL (Hue, Saturation, Lightness)
function hexToHSL(hex: string) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Check if two hues are similar (within a threshold)
const isHueSimilar = (h1: number, h2: number, threshold = 30) => {
  const diff = Math.abs(h1 - h2);
  return diff <= threshold || diff >= 360 - threshold;
};

export default function PlannerScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { user } = useAuth();
  
  const [closetItems, setClosetItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recommendations
  const [complementary, setComplementary] = useState<Item[]>([]);
  const [monochromatic, setMonochromatic] = useState<Item[]>([]);
  const [analogous, setAnalogous] = useState<Item[]>([]);

  useEffect(() => {
    loadCloset();
  }, [user]);

  const loadCloset = async () => {
    if (user) {
      setLoading(true);
      try {
        const items = await getUserItems(user.id);
        
        // FIX START: Convert raw storage paths to Signed URLs
        const signedItems = await Promise.all(
          items.map(async (item) => {
            // Only sign if it looks like a path (doesn't start with http)
            if (item.image_url && !item.image_url.startsWith('http')) {
              const signedUrl = await getSignedImageUrl(item.image_url);
              return { ...item, image_url: signedUrl || item.image_url };
            }
            return item;
          })
        );
        // FIX END
        
        setClosetItems(signedItems);
      } catch (error) {
        console.error("Failed to load closet:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateRecommendations = (baseItem: Item) => {
    if (!baseItem.primary_color) {
      // If item has no AI color, we can't recommend. 
      // (Older items might need re-uploading)
      setComplementary([]);
      setMonochromatic([]);
      setAnalogous([]);
      return;
    }

    const baseHSL = hexToHSL(baseItem.primary_color);
    const compHue = (baseHSL.h + 180) % 360;
    const analogHue1 = (baseHSL.h + 30) % 360;
    const analogHue2 = (baseHSL.h - 30 + 360) % 360;

    const compMatches: Item[] = [];
    const monoMatches: Item[] = [];
    const analogMatches: Item[] = [];

    closetItems.forEach(item => {
      if (item.id === baseItem.id) return; // Don't recommend itself
      if (!item.primary_color) return;

      const itemHSL = hexToHSL(item.primary_color);

      // 1. Monochromatic: Similar hue, different lightness/saturation
      if (isHueSimilar(baseHSL.h, itemHSL.h, 15)) {
        monoMatches.push(item);
      }
      // 2. Complementary: Opposite hue
      else if (isHueSimilar(itemHSL.h, compHue, 20)) {
        compMatches.push(item);
      }
      // 3. Analogous: Neighbors on wheel
      else if (isHueSimilar(itemHSL.h, analogHue1, 20) || isHueSimilar(itemHSL.h, analogHue2, 20)) {
        analogMatches.push(item);
      }
    });

    setComplementary(compMatches);
    setMonochromatic(monoMatches);
    setAnalogous(analogMatches);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setModalVisible(false);
    calculateRecommendations(item);
  };

  const renderSection = (title: string, items: Item[]) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: themedColors.text }]}>{title}</Text>
      {items.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {items.map(item => (
            <View key={item.id} style={styles.recommendationCard}>
              <Image source={{ uri: item.image_url }} style={styles.recommendationImage} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: themedColors.card }]}>
          <Text style={{ color: themedColors.textSecondary }}>No matching items found</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Color Planner</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Main Selection Area */}
        <Text style={[styles.instruction, { color: themedColors.text }]}>Select a base item to plan around:</Text>
        
        <TouchableOpacity 
          style={[styles.selectorBox, { borderColor: themedColors.border, backgroundColor: themedColors.card }]}
          onPress={() => setModalVisible(true)}
        >
          {selectedItem ? (
            <Image source={{ uri: selectedItem.image_url }} style={styles.selectedImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: themedColors.textSecondary }]}>
                Please Select an Item
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {selectedItem && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.subHeader, { color: themedColors.text }]}>Suggestions</Text>
            {renderSection('Complementary', complementary)}
            {renderSection('Monochromatic', monochromatic)}
            {renderSection('Analogous', analogous)}
          </View>
        )}
      </ScrollView>

      {/* Item Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: themedColors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themedColors.text }]}>Pick from Closet</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={themedColors.text} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
             <ActivityIndicator size="large" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={closetItems}
              numColumns={3}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => handleSelectItem(item)}
                >
                  {/* Now that we have signed URLs, this Image component will work */}
                  <Image source={{ uri: item.image_url }} style={styles.pickerImage} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectorBox: {
    width: '100%',
    aspectRatio: 1, // Square
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    marginTop: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  listContent: {
    paddingRight: 16,
  },
  recommendationCard: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  recommendationImage: {
    width: '100%',
    height: '100%',
  },
  emptyBox: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  
  // Modal Styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  pickerItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 4,
  },
  pickerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
});