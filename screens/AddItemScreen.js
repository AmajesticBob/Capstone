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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';

export default function AddItemScreen({ navigation }) {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const [itemName, setItemName] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              <View style={[styles.pickerContainer, { backgroundColor: themedColors.input }]}>
                <Text style={[styles.pickerText, { color: category ? themedColors.text : themedColors.textSecondary }]}>
                  {category || 'Select a category'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={themedColors.textSecondary} />
              </View>
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

      <View style={[styles.footer, { backgroundColor: themedColors.background, borderTopColor: themedColors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Item</Text>
        </TouchableOpacity>
      </View>
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
});
