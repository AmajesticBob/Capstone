export const colors = {
  primary: '#6366F1',
  backgroundLight: '#F9FAFB',
  backgroundDark: '#111827',
  cardLight: '#FFFFFF',
  cardDark: '#1F2937',
  textLight: '#111827',
  textDark: '#F9FAFB',
  textSecondaryLight: '#6B7280',
  textSecondaryDark: '#9CA3AF',
  borderLight: '#E5E7EB',
  borderDark: '#374151',
  inputLight: '#F3F4F6',
  inputDark: '#374151',
};

export const getThemedColors = (isDark) => ({
  background: isDark ? colors.backgroundDark : colors.backgroundLight,
  card: isDark ? colors.cardDark : colors.cardLight,
  text: isDark ? colors.textDark : colors.textLight,
  textSecondary: isDark ? colors.textSecondaryDark : colors.textSecondaryLight,
  border: isDark ? colors.borderDark : colors.borderLight,
  input: isDark ? colors.inputDark : colors.inputLight,
});
