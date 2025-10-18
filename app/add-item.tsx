import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';
import { GlassView } from 'expo-glass-effect';
import { useAlert } from '../components/Alert';

export default function AddItemScreen() {
  const router = useRouter();
  const { isDark, syncWithSystem } = useTheme();
  const themedColors = getThemedColors(isDark);
  const { showAlert, AlertComponent } = useAlert();
  const [itemName, setItemName] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const categories = ['Tops', 'Bottoms', 'Shoes'];

  const handleSave = () => {
    // Validate required fields
    if (!itemName.trim()) {
      showAlert('Please enter an item name', 'Validation Error');
      return;
    }
    if (!category) {
      showAlert('Please select a category', 'Validation Error');
      return;
    }
    
    // Here you would normally save the item to your data store
    // For now, we'll just navigate back
    router.back();
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryMenu(false);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themedColors.text }]}>Photo</Text>
              <TouchableOpacity style={[styles.photoUpload, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
                <MaterialIcons name="add-a-photo" size={48} color={themedColors.textSecondary} />
                <Text style={[styles.photoText, { color: themedColors.textSecondary }]}>Tap to upload a photo</Text>
                <Text style={[styles.photoSubtext, { color: themedColors.textSecondary }]}>or take a new one</Text>
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

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: themedColors.text }]}>Color</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themedColors.input, color: themedColors.text }]}
                  placeholder="e.g., Blue"
                  placeholderTextColor={themedColors.textSecondary}
                  value={color}
                  onChangeText={setColor}
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
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Item</Text>
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
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
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
