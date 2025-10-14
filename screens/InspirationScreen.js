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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';

const inspirationLooks = [
  {
    id: 1,
    title: 'Street Style Chic',
    description: 'Inspired by your uploaded photo.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdflLHNcWwMXL-4hOPiTtS5aavmaa7gfzA99hloN_p0NTankadS1gIcSlYsPrAFkVu9MdKknch-X4eVF1qnFWoH2Sn7nA7gFZvrQIrGAzaQ0ZjRyDaYg4QUD8DgDT1VHjNNOcciOUUBewFROXkDftxhAVBNyrd10taorsnJof0QTBVt6rzg7n9gMcJPSt17wH6yg6IWQgjnykXHNcspAAefKfxte9leOOQ1h2sdTTKTNQ0D3XRRNdklZ87FaFjWb2Tvq2tLXKzzdy7',
    items: [
      { name: 'White Tee', color: '#FFFFFF' },
      { name: 'Blue Jeans', color: '#93C5FD' },
      { name: 'Black Boots', color: '#1F2937' },
    ],
  },
  {
    id: 2,
    title: 'Summer Casual',
    description: 'Inspired by your uploaded photo.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5xBps3FaXjBW-0AotbveBvbAPyCX8NONutblvf9M4Y1r98-YW2MdZL86cvg1bI3eJXCv8M8IiyEObkTmIruAuocv5VRdvfZx5ouqjssB4i4aFrOx-jqaVBAwM5guIohcV-GhGneF9HLps41oiyTRcehuRr7_z3cP1leVtzXzXnf66KQOBh9gM73Azv_Of15wKA0XxTj2ZePUkP6zreTO5MlbnNP_wzqE_kmTy6dyC7FOMrCosWnYs__DzXWeLrWrZLLOtyVxvevBv',
    items: [
      { name: 'Orange Dress', color: '#FDBA74' },
      { name: 'White Shoes', color: '#FEF08A' },
    ],
  },
];

export default function InspirationScreen() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={[styles.header, { backgroundColor: themedColors.background, borderBottomColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>Inspiration</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.uploadCard, { backgroundColor: themedColors.card }]}>
          <Text style={[styles.uploadTitle, { color: themedColors.text }]}>Get Outfit Ideas</Text>
          <Text style={[styles.uploadDescription, { color: themedColors.textSecondary }]}>
            Upload a photo to find similar items from your closet and build an outfit.
          </Text>
          <View style={[styles.uploadArea, { borderColor: themedColors.border }]}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={48} color={themedColors.textSecondary} />
            <Text style={[styles.uploadLabel, { color: themedColors.text }]}>Upload Inspiration</Text>
            <Text style={[styles.uploadSubtext, { color: themedColors.textSecondary }]}>
              PNG, JPG, GIF up to 10MB
            </Text>
            <TouchableOpacity style={[styles.browseButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.browseButtonText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.looksSection}>
          <Text style={[styles.sectionTitle, { color: themedColors.text }]}>Your Inspired Looks</Text>
          {inspirationLooks.map((look) => (
            <View key={look.id} style={[styles.lookCard, { backgroundColor: themedColors.card }]}>
              <Image source={{ uri: look.image }} style={styles.lookImage} resizeMode="cover" />
              <View style={styles.lookContent}>
                <Text style={[styles.lookTitle, { color: themedColors.text }]}>{look.title}</Text>
                <Text style={[styles.lookDescription, { color: themedColors.textSecondary }]}>
                  {look.description}
                </Text>
                <View style={styles.itemsContainer}>
                  {look.items.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.lookItem,
                        { backgroundColor: item.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lookItemText,
                          { color: item.color === '#FFFFFF' || item.color === '#FEF08A' ? '#111827' : '#FFFFFF' },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={[styles.tryOnButton, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.tryOnButtonText, { color: colors.primary }]}>View & Try On</Text>
                </TouchableOpacity>
              </View>
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
  uploadCard: {
    marginTop: 24,
    marginBottom: 32,
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
    padding: 32,
    alignItems: 'center',
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
  looksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  lookCard: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  lookImage: {
    width: '100%',
    height: 192,
  },
  lookContent: {
    padding: 16,
  },
  lookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  lookDescription: {
    fontSize: 12,
    marginBottom: 16,
  },
  itemsContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  lookItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 4,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookItemText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  tryOnButton: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  tryOnButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
