import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { getUserItems, getSignedImageUrl } from '../../lib/items';
import { generateVirtualTryOn } from '../../lib/gemini';
import { Item } from '../../types/items';
import { useAlert } from '../../components/Alert';
import { useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function TryOnScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedTop, setSelectedTop] = useState<Item | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<Item | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<Item | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user's items
  const loadItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userItems = await getUserItems(user.id);
      setItems(userItems);

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
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [user])
  );

  const pickModelImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission to access media library is required', 'Permission Denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setModelImage(result.assets[0].uri);
        setResult(null); setGeneratedImage(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Failed to pick image', 'Error');
    }
  };

  const takeModelPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission to access camera is required', 'Permission Denied');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setModelImage(result.assets[0].uri);
        setResult(null); setGeneratedImage(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Failed to take photo', 'Error');
    }
  };

  const showModelImageOptions = () => {
    Alert.alert(
      'Add Model Photo',
      'Choose or take a photo of yourself or a model',
      [
        {
          text: 'Take Photo',
          onPress: takeModelPhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickModelImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleGenerateTryOn = async () => {
    if (!modelImage) {
      showAlert('Please upload a model image first', 'Model Image Required');
      return;
    }

    if (!selectedTop && !selectedBottom && !selectedShoe) {
      showAlert('Please select at least one clothing item', 'No Items Selected');
      return;
    }

    try {
      setIsGenerating(true);
      setResult(null); setGeneratedImage(null);
      setGeneratedImage(null);

      const topImageUrl = selectedTop?.image_url ? signedUrls[selectedTop.id] : undefined;
      const bottomImageUrl = selectedBottom?.image_url ? signedUrls[selectedBottom.id] : undefined;
      const shoeImageUrl = selectedShoe?.image_url ? signedUrls[selectedShoe.id] : undefined;

      const tryOnResult = await generateVirtualTryOn(
        modelImage,
        topImageUrl,
        bottomImageUrl,
        shoeImageUrl
      );

      console.log('Try-on result:', tryOnResult);
      console.log('Has image data:', !!tryOnResult.imageData);
      console.log('Image data length:', tryOnResult.imageData?.length);

      setResult(tryOnResult.description);
      if (tryOnResult.imageData) {
        // Convert base64 to data URI for display
        const dataUri = `data:image/png;base64,${tryOnResult.imageData}`;
        console.log('Setting generated image, data URI length:', dataUri.length);
        setGeneratedImage(dataUri);
      } else {
        console.warn('No image data in response');
      }
    } catch (error) {
      console.error('Error generating try-on:', error);
      showAlert(
        error instanceof Error ? error.message : 'Failed to generate virtual try-on',
        'Error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShuffle = () => {
    const tops = items.filter(item => item.category === 'Tops' && item.image_url);
    const bottoms = items.filter(item => item.category === 'Bottoms' && item.image_url);
    const shoes = items.filter(item => item.category === 'Shoes' && item.image_url);

    if (tops.length > 0) {
      const randomTop = tops[Math.floor(Math.random() * tops.length)];
      setSelectedTop(randomTop);
    }
    if (bottoms.length > 0) {
      const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      setSelectedBottom(randomBottom);
    }
    if (shoes.length > 0) {
      const randomShoe = shoes[Math.floor(Math.random() * shoes.length)];
      setSelectedShoe(randomShoe);
    }
    setResult(null); setGeneratedImage(null);
  };

  const getItemsByCategory = (category: string): Item[] => {
    return items.filter(item => item.category === category && item.image_url);
  };

  const renderHorizontalItem = (item: Item, category: 'Tops' | 'Bottoms' | 'Shoes') => {
    const imageUrl = item.image_url ? signedUrls[item.id] : null;
    const isSelected = 
      (category === 'Tops' && selectedTop?.id === item.id) ||
      (category === 'Bottoms' && selectedBottom?.id === item.id) ||
      (category === 'Shoes' && selectedShoe?.id === item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.horizontalItem,
          { backgroundColor: themedColors.card },
          isSelected && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={() => {
          if (category === 'Tops') setSelectedTop(item);
          else if (category === 'Bottoms') setSelectedBottom(item);
          else if (category === 'Shoes') setSelectedShoe(item);
          setResult(null); setGeneratedImage(null);
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.horizontalItemImage} />
        ) : (
          <View style={[styles.horizontalItemPlaceholder, { backgroundColor: themedColors.input }]}>
            <ActivityIndicator size="small" color={themedColors.textSecondary} />
          </View>
        )}
        <Text style={[styles.horizontalItemName, { color: themedColors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialIcons name="check" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
        <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
          <Text style={[styles.headerTitle, { color: themedColors.text }]}>Virtual Try-On</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const tops = getItemsByCategory('Tops');
  const bottoms = getItemsByCategory('Bottoms');
  const shoes = getItemsByCategory('Shoes');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Virtual Try-On</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.mainContent}>
          {/* Image Display Area - Left Side */}
          <View style={styles.imageSection}>
            <View style={[styles.imageContainer, { backgroundColor: themedColors.card }]}>
              {(generatedImage || modelImage) ? (
                <Image 
                  source={{ uri: generatedImage || modelImage }} 
                  style={styles.modelDisplayImage} 
                />
              ) : (
                <View style={styles.emptyImageContainer}>
                  <MaterialCommunityIcons 
                    name="account" 
                    size={80} 
                    color={themedColors.textSecondary} 
                  />
                  <Text style={[styles.emptyImageText, { color: themedColors.textSecondary }]}>
                    Upload a model photo
                  </Text>
                </View>
              )}
              
              {/* Overlay Gradient */}
              {modelImage && (
                <View style={styles.imageOverlay}>
                  {/* Top Action Buttons */}
                  <View style={styles.topButtons}>
                    <TouchableOpacity 
                      style={styles.aiGenButton}
                      onPress={handleGenerateTryOn}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="auto-fix" size={16} color="#FFFFFF" />
                          <Text style={styles.buttonText}>AI Gen</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
                      <MaterialIcons name="shuffle" size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Shuffle</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Action Buttons */}
                  <View style={styles.bottomButtons}>
                    {generatedImage && (
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => {
                          setGeneratedImage(null);
                          setResult(null);
                        }}
                      >
                        <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.iconButton}>
                      <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={showModelImageOptions}>
                      <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Upload button when no model image */}
              {!modelImage && (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={showModelImageOptions}
                >
                  <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Item Selection Area - Right Side */}
          <View style={styles.selectionSection}>
            {/* Tops */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryTitle, { color: themedColors.text }]}>Tops</Text>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </View>
              {tops.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {tops.map(item => renderHorizontalItem(item, 'Tops'))}
                </ScrollView>
              ) : (
                <Text style={[styles.emptyCategory, { color: themedColors.textSecondary }]}>
                  No tops with images
                </Text>
              )}
            </View>

            {/* Bottoms */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryTitle, { color: themedColors.text }]}>Bottoms</Text>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </View>
              {bottoms.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {bottoms.map(item => renderHorizontalItem(item, 'Bottoms'))}
                </ScrollView>
              ) : (
                <Text style={[styles.emptyCategory, { color: themedColors.textSecondary }]}>
                  No bottoms with images
                </Text>
              )}
            </View>

            {/* Shoes */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryTitle, { color: themedColors.text }]}>Shoes</Text>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </View>
              {shoes.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {shoes.map(item => renderHorizontalItem(item, 'Shoes'))}
                </ScrollView>
              ) : (
                <Text style={[styles.emptyCategory, { color: themedColors.textSecondary }]}>
                  No shoes with images
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <AlertComponent />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flexDirection: width > 768 ? 'row' : 'column',
    padding: 16,
    gap: 16,
  },
  imageSection: {
    flex: width > 768 ? 1 : undefined,
    marginBottom: width > 768 ? 0 : 24,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  modelDisplayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImageText: {
    fontSize: 14,
    marginTop: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  topButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  aiGenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultScroll: {
    maxHeight: 140,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectionSection: {
    flex: width > 768 ? 1 : undefined,
    gap: 24,
  },
  categorySection: {
    marginBottom: 8,
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
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    gap: 12,
    paddingRight: 16,
  },
  horizontalItem: {
    width: 96,
    height: 128,
    borderRadius: 12,
    padding: 8,
    position: 'relative',
  },
  horizontalItemImage: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  horizontalItemPlaceholder: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalItemName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCategory: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
