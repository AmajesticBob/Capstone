import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { getUserItems, getSignedImageUrl } from '../../lib/items';
import { Item } from '../../types/items';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;

export default function ClosetScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const categories = ['All', 'Tops', 'Bottoms', 'Shoes'];

  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const loadItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userItems = await getUserItems(user.id);
      setItems(userItems);
      setHasLoadedOnce(true);

      // Generate signed URLs for all items with images
      const urls: Record<string, string> = {};
      const urlPromises = userItems
        .filter(item => item.image_url)
        .map(async (item) => {
          const signedUrl = await getSignedImageUrl(item.image_url!);
          if (signedUrl) {
            urls[item.id] = signedUrl;
          }
        });
      await Promise.all(urlPromises);
      setSignedUrls(urls);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only show loading spinner on initial load
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      loadItems();
    }, [user, hasLoadedOnce])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const renderItemImage = (item: Item, imageUrl: string | null) => {
    if (imageUrl) {
      return <Image source={{ uri: imageUrl }} style={styles.itemImage} />;
    }
    
    if (item.image_url) {
      // Image exists but signed URL is still loading
      return (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: themedColors.input }]}>
          <ActivityIndicator size="small" color={themedColors.textSecondary} />
        </View>
      );
    }
    
    // No image for this item
    return (
      <View style={[styles.itemImagePlaceholder, { backgroundColor: themedColors.input }]}>
        <MaterialIcons name="checkroom" size={48} color={themedColors.textSecondary} />
      </View>
    );
  };

  const renderItem = (item: Item) => {
    const imageUrl = item.image_url ? signedUrls[item.id] : null;
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.itemCard, { backgroundColor: themedColors.card }]}
        onPress={() => router.push(`/edit-item?id=${item.id}`)}
        activeOpacity={0.7}
      >
        {renderItemImage(item, imageUrl)}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: themedColors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemCategory, { color: themedColors.textSecondary }]}>
            {item.category}
          </Text>
          {item.color && (
            <Text style={[styles.itemDetail, { color: themedColors.textSecondary }]} numberOfLines={1}>
              {item.color}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>My Closet</Text>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push('/add-item')}
        >
          <MaterialIcons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Filter Tabs */}
      <View style={[styles.categoryTabs, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && { backgroundColor: colors.primary },
                selectedCategory === cat ? {} : { backgroundColor: themedColors.input }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  { color: selectedCategory === cat ? '#FFFFFF' : themedColors.text }
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="hourglass-empty" size={80} color={themedColors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: themedColors.text }]}>Loading...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="checkroom" size={80} color={themedColors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: themedColors.text }]}>
            {items.length === 0 ? 'Your Closet is Empty' : `No ${selectedCategory} Items`}
          </Text>
          <Text style={[styles.emptySubtitle, { color: themedColors.textSecondary }]}>
            {items.length === 0 
              ? 'Start adding items to organize your wardrobe'
              : `You don't have any ${selectedCategory.toLowerCase()} items yet`
            }
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/add-item')}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themedColors.text}
            />
          }
        >
          <View style={styles.grid}>
            {filteredItems.map(renderItem)}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  addIconButton: {
    padding: 4,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: CARD_MARGIN / 2,
  },
  itemCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN / 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  itemImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
