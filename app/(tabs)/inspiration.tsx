import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../components/Alert';
import { uploadTempImage, searchSimilarItems, deleteFromStorage } from '../../lib/items';
import { Item } from '../../types/items';

// provide outfit structure for the eventual card
interface Outfit {
  top?: Item;
  bottom?: Item;
  shoes?: Item;
}

export default function InspirationScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<Outfit | null>(null);
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Ref to track the storage path of the current image so we can delete it later
  const tempStoragePathRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Optional: Attempt to cleanup on unmount (e.g. Logout). 
  // Note: This is "best effort" and won't run if the app is force-closed.
  useEffect(() => {
    return () => {
      if (tempStoragePathRef.current) {
        deleteFromStorage('temp-images', tempStoragePathRef.current)
          .catch(err => console.log("Unmount cleanup failed:", err));
      }
    };
  }, []);

  function RemoteImage({ uri, style, resizeMode = 'cover' }: { uri?: string, style?: any, resizeMode?: any }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (!uri) {
      return <View style={[style, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}><Text style={{fontSize: 10}}>No Image</Text></View>;
    }
    return (
      <View style={[style, { backgroundColor: '#eee', overflow: 'hidden' }]}>
        {loading && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={themedColors.primary || colors.primary} />
          </View>
        )}
        {!error && (
          <Image
            source={{ uri }}
            style={[StyleSheet.absoluteFill]}
            resizeMode={resizeMode}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
        {error && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 12, color: themedColors.textSecondary }}>Failed to load</Text>
          </View>
        )}
      </View>
    );
  }

  const pickImage = async () => {
    if (isProcessing) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission to access media library is required', 'Permission Denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && Array.isArray(result.assets) && result.assets.length > 0 && result.assets[0].uri) {
        // CLEANUP: If there is already an image in storage, delete it before uploading the new one
        if (tempStoragePathRef.current) {
          // We don't await this because we don't want to block the UI for cleanup
          deleteFromStorage('temp-images', tempStoragePathRef.current)
            .catch(err => console.log("Error cleaning up old image:", err));
          tempStoragePathRef.current = null;
        }

        setInspirationImage(result.assets[0].uri);
        await generateOutfitFromImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Failed to pick image', 'Error');
    }
  };

  const generateOutfitFromImage = async (uri: string) => {
    if (!user) {
      showAlert('You must be signed in to use this feature', 'Not Signed In');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    
    if (isMountedRef.current) {
      setGeneratedOutfit(null);
    }
    
    let tempPath: string | null = null;

    try {
      tempPath = await uploadTempImage(user.id, uri);
      // Store the path in ref so we can delete it later (on replace or unmount)
      tempStoragePathRef.current = tempPath;

      const getFirst = (res: any) => {
        if (!res) return null;
        if (Array.isArray(res) && res.length > 0) return res[0];
        if (res.items && Array.isArray(res.items) && res.items.length > 0) return res.items[0];
        return null;
      };

      const promises = [
        searchSimilarItems(user.id, { queryImagePath: tempPath }, 'Tops').catch((e) => { console.error('Tops search error', e); return null; }),
        searchSimilarItems(user.id, { queryImagePath: tempPath }, 'Bottoms').catch((e) => { console.error('Bottoms search error', e); return null; }),
        searchSimilarItems(user.id, { queryImagePath: tempPath }, 'Shoes').catch((e) => { console.error('Shoes search error', e); return null; }),
      ];

      const [topsRes, bottomsRes, shoesRes] = await Promise.all(promises);
      const topMatch = getFirst(topsRes);
      const bottomMatch = getFirst(bottomsRes);
      const shoeMatch = getFirst(shoesRes);

      const newOutfit: Outfit = {};
      let matchCount = 0;

      if (topMatch) { newOutfit.top = topMatch; matchCount++; }
      if (bottomMatch) { newOutfit.bottom = bottomMatch; matchCount++; }
      if (shoeMatch) { newOutfit.shoes = shoeMatch; matchCount++; }

      if (matchCount === 0) {
        showAlert('No similar items found in your closet.', 'No Matches');
      } else {
        if (isMountedRef.current) {
          setGeneratedOutfit(newOutfit);
        }
        if (matchCount < 3) {
          showAlert('Partial outfit created.', 'Partial Match');
        }
      }

    } catch (error) {
      console.error('Error generating outfit:', error);
      showAlert('Failed to analyze the image.', 'Error');
      // If error occurred, we MIGHT want to clean up immediately, 
      // but keeping it allows the user to try again if it was a network glitch.
    } finally {
      // REMOVED: deleteFromStorage(tempPath)
      // We purposefully DO NOT delete the image here anymore.
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const renderOutfitCard = () => {
    if (!generatedOutfit) return null;
    const gridItems = [
      { label: 'Top', item: generatedOutfit.top },
      { label: 'Bottom', item: generatedOutfit.bottom },
      { label: 'Shoes', item: generatedOutfit.shoes },
      { label: 'Extra', item: null },
    ];
    return (
      <View style={styles.resultContainer}>
        <Text style={[styles.resultTitle, { color: themedColors.text }]}>Inspired Look</Text>
        <TouchableOpacity
          style={[
            styles.outfitCard,
            { backgroundColor: themedColors.card, borderColor: themedColors.border },
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          <View style={styles.grid2x2}>
            {gridItems.map((slot, index) => (
              <View key={index} style={styles.gridCell}>
                {slot.item ? (
                  <RemoteImage uri={slot.item.image_url} style={styles.gridCellImage} />
                ) : (
                  <View
                    style={[
                      styles.gridPlaceholder,
                      { backgroundColor: themedColors.background },
                    ]}
                  >
                    <Text style={{ color: themedColors.textSecondary, fontSize: 10 }}>
                      No {slot.label}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.tapText, { color: themedColors.textSecondary }]}>
              Tap to view details
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Inspiration</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.uploadCard, { backgroundColor: themedColors.card }]}>
          <Text style={[styles.uploadTitle, { color: themedColors.text }]}>Get Outfit Ideas</Text>
          <Text style={[styles.uploadDescription, { color: themedColors.textSecondary }]}>
            Upload a photo to find similar items from your closet and build an outfit.
          </Text>
          
          {inspirationImage ? (
             <View style={styles.previewContainer}>
                <Image 
                  source={{ uri: inspirationImage }} 
                  style={styles.previewImage} 
                  resizeMode="contain"
                />
                
                {isProcessing && (
                  <View style={styles.processingOverlay}>
                     <ActivityIndicator size="large" color="#fff" />
                     <Text style={{color: '#fff', marginTop: 12, fontWeight: '600'}}>Analyzing Outfit...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.browseButton, { backgroundColor: themedColors.primary || colors.primary, marginTop: 16 }]}
                  onPress={pickImage}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.browseButtonText}>Try Another Photo</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <TouchableOpacity 
              style={[styles.uploadArea, { borderColor: themedColors.border }]}
              onPress={pickImage}
              disabled={isProcessing}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={48} color={themedColors.textSecondary} />
              <Text style={[styles.uploadLabel, { color: themedColors.text }]}>Upload Inspiration</Text>
              <Text style={[styles.uploadSubtext, { color: themedColors.textSecondary }]}>
                PNG, JPG, GIF up to 5MB
              </Text>
              <TouchableOpacity
                style={[styles.browseButton, { backgroundColor: colors.primary }]}
                onPress={pickImage}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.browseButtonText}>Browse Files</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {generatedOutfit ? (
          renderOutfitCard()
        ) : (
          (!isProcessing && !inspirationImage) && (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="image-search-outline" size={64} color={themedColors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: themedColors.text }]}>No Inspired Looks Yet</Text>
              <Text style={[styles.emptySubtitle, { color: themedColors.textSecondary }]}>
                Upload inspiration photos to see outfit suggestions
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={[styles.modalContent, { backgroundColor: themedColors.card }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themedColors.text }]}>Outfit Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <MaterialIcons name="close" size={24} color={themedColors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {generatedOutfit?.top && (
                  <View style={styles.detailItem}>
                    <RemoteImage uri={generatedOutfit.top.image_url} style={styles.detailImage} />
                    <View style={styles.detailText}>
                      <Text style={[styles.detailCategory, { color: colors.primary }]}>Top</Text>
                      <Text style={[styles.detailName, { color: themedColors.text }]}>{generatedOutfit.top.name}</Text>
                      <Text style={[styles.detailBrand, { color: themedColors.textSecondary }]}>{generatedOutfit.top.brand || 'No Brand'}</Text>
                    </View>
                  </View>
                )}
                
                {generatedOutfit?.bottom && (
                  <View style={styles.detailItem}>
                    <RemoteImage uri={generatedOutfit.bottom.image_url} style={styles.detailImage} />
                    <View style={styles.detailText}>
                      <Text style={[styles.detailCategory, { color: colors.primary }]}>Bottom</Text>
                      <Text style={[styles.detailName, { color: themedColors.text }]}>{generatedOutfit.bottom.name}</Text>
                      <Text style={[styles.detailBrand, { color: themedColors.textSecondary }]}>{generatedOutfit.bottom.brand || 'No Brand'}</Text>
                    </View>
                  </View>
                )}

                {generatedOutfit?.shoes && (
                  <View style={styles.detailItem}>
                    <RemoteImage uri={generatedOutfit.shoes.image_url} style={styles.detailImage} />
                    <View style={styles.detailText}>
                      <Text style={[styles.detailCategory, { color: colors.primary }]}>Shoes</Text>
                      <Text style={[styles.detailName, { color: themedColors.text }]}>{generatedOutfit.shoes.name}</Text>
                      <Text style={[styles.detailBrand, { color: themedColors.textSecondary }]}>{generatedOutfit.shoes.brand || 'No Brand'}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <AlertComponent />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  uploadCard: {
    marginTop: 24,
    marginBottom: 24,
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
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
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

  // Results Styles
  resultContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  outfitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardFooter: {
    paddingTop: 8,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 12,
    marginTop: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  detailImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailBrand: {
    fontSize: 14,
  },

  // styles for the display grid
  grid2x2: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridCell: {
    width: '50%',
    height: '50%',
    aspectRatio: 1, 
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  gridCellImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});