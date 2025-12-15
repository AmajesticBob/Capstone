import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';
import { GlassView } from 'expo-glass-effect';
import { useAlert } from '../components/Alert';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadItemImage, createItem } from '../lib/items';
import { generateItemClassification } from '../lib/gemini';

export default function AddItemScreen() {
  const router = useRouter();
  const { isDark, syncWithSystem } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { showAlert, AlertComponent } = useAlert();
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const categories = ['Tops', 'Bottoms', 'Shoes'];

  const handleSave = async () => {
    // Validate required fields
    if (!itemName.trim()) {
      showAlert('Please enter an item name', 'Validation Error');
      return;
    }
    if (!category) {
      showAlert('Please select a category', 'Validation Error');
      return;
    }

    if (!user) {
      showAlert('You must be logged in to add items', 'Authentication Error');
      return;
    }

    try {
      setIsUploading(true);

      let imageUrl: string | undefined = undefined;

      // Upload image if one was selected
      if (imageUri) {
        try {
          imageUrl = await uploadItemImage(user.id, imageUri);
        } catch (error) {
          console.error('Error uploading image:', error);
          showAlert('Failed to upload image. Item will be saved without photo.', 'Upload Error');
        }
      }

      // Save item to database
      await createItem(user.id, {
        name: itemName.trim(),
        category,
        color: color.trim() || undefined,
        color_hex: colorHex.trim() || undefined,
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        image_url: imageUrl,
      });

      showAlert('Item added successfully!', 'Success');
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error saving item:', error);
      showAlert('Failed to save item. Please try again.', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission to access media library is required', 'Permission Denied');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Failed to pick image', 'Error');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission to access camera is required', 'Permission Denied');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Failed to take photo', 'Error');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose a photo for your item',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryMenu(false);
  };

  const handleGenerateWithAI = async () => {
    // Check if image is uploaded
    if (!imageUri) {
      showAlert('Please upload a photo first to use Auto Fill', 'Photo Required');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Clear existing fields first
      setItemName('');
      setCategory('');
      setColor('');
      setColorHex('');
      setDescription('');
      
      // Generate classification using AI with image
      const classification = await generateItemClassification(imageUri);
      
      // Fill the form fields with generated data (including hidden colorHex)
      setItemName(classification.name);
      setCategory(classification.category);
      setColor(classification.color);
      setColorHex(classification.colorHex);
      setDescription(classification.description);
      
      showAlert('Item details generated successfully!', 'Success');
    } catch (error) {
      console.error('Error generating with AI:', error);
      showAlert(
        error instanceof Error ? error.message : 'Failed to generate item details. Please try again.',
        'Error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={24} color={themedColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Add New Item</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themedColors.text }]}>Photo</Text>
              <TouchableOpacity 
                style={[styles.photoUpload, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}
                onPress={showImageOptions}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode='contain'/>
                ) : (
                  <>
                    <MaterialIcons name="add-a-photo" size={48} color={themedColors.textSecondary} />
                    <Text style={[styles.photoText, { color: themedColors.textSecondary }]}>Tap to upload a photo</Text>
                    <Text style={[styles.photoSubtext, { color: themedColors.textSecondary }]}>or take a new one</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themedColors.text }]}>Item Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themedColors.input, color: themedColors.text }]}
                placeholder="e.g., Comfy Blue Jeans"
                placeholderTextColor={themedColors.textSecondary}
                value={itemName}
                onChangeText={setItemName}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                  }, 300);
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themedColors.text }]}>Category</Text>
              <TouchableOpacity 
                style={[styles.pickerContainer, { backgroundColor: themedColors.input }]}
                onPress={() => setShowCategoryMenu(true)}
              >
                <Text style={[styles.pickerText, { color: category ? themedColors.text : themedColors.textSecondary }]}>
                  {category || 'Select a category'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={themedColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* AI Generation Button */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={[styles.aiButton, { backgroundColor: colors.primary, opacity: isGenerating ? 0.6 : 1 }]}
                onPress={handleGenerateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.aiButtonText}>Generating...</Text>
                  </>
                ) : (
                  <Text style={styles.aiButtonText}>Auto Fill</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themedColors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: themedColors.input, color: themedColors.text }]}
                placeholder="e.g., Comfortable casual jeans perfect for everyday wear"
                placeholderTextColor={themedColors.textSecondary}
                value={description}
                onChangeText={setDescription}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 500, animated: true });
                  }, 300);
                }}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: themedColors.text }]}>Color</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themedColors.input, color: themedColors.text }]}
                  placeholder="e.g., Blue"
                  placeholderTextColor={themedColors.textSecondary}
                  value={color}
                  onChangeText={setColor}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 550, animated: true });
                    }, 300);
                  }}
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: themedColors.text }]}>Brand</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themedColors.input, color: themedColors.text }]}
                  placeholder="e.g., Style Co."
                  placeholderTextColor={themedColors.textSecondary}
                  value={brand}
                  onChangeText={setBrand}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 550, animated: true });
                    }, 300);
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal with Glass Effect */}
      <Modal
        visible={showCategoryMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryMenu(false)}
        supportedOrientations={['portrait']}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCategoryMenu(false)}
        >
          <View style={styles.modalContent}>
            {Platform.OS === 'ios' && syncWithSystem ? (
              <GlassView 
                style={styles.glassMenu}
                glassEffectStyle="regular"
                isInteractive={true}
              >
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>Select Category</Text>
                </View>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.menuItem,
                      index === categories.length - 1 && styles.menuItemLast
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Text style={styles.menuItemText}>{cat}</Text>
                    {category === cat && (
                      <MaterialIcons name="check" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </GlassView>
            ) : (
              <View style={[styles.glassMenu, { backgroundColor: themedColors.card }]}>
                <View style={styles.menuHeader}>
                  <Text style={[styles.menuTitle, { color: themedColors.text }]}>Select Category</Text>
                </View>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.menuItem,
                      index === categories.length - 1 && styles.menuItemLast
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Text style={[styles.menuItemText, { color: themedColors.text }]}>{cat}</Text>
                    {category === cat && (
                      <MaterialIcons name="check" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.footer, { backgroundColor: themedColors.background, borderTopColor: themedColors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isUploading ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Item</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  form: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  photoUpload: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 14,
    marginTop: 8,
  },
  photoSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  aiButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerContainer: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
  },
  glassMenu: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
  },
  menuHeader: {
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
