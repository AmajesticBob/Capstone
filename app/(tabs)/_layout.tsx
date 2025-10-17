import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <NativeTabs
      backgroundColor={Platform.OS === 'ios' ? null : themedColors.card}
      blurEffect={Platform.OS === 'ios' ? (isDark ? 'systemMaterialDark' : 'systemMaterialLight') : undefined}
      tintColor={colors.primary}
      iconColor={themedColors.textSecondary}
    >
      <NativeTabs.Trigger name="index">
        <Icon 
          src={<VectorIcon family={MaterialCommunityIcons} name="hanger" />} 
        />
        <Label>Closet</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <Icon 
          src={<VectorIcon family={MaterialIcons} name="grid-view" />} 
        />
        <Label>Planner</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="try-on">
        <Icon 
          src={<VectorIcon family={MaterialCommunityIcons} name="human" />} 
        />
        <Label>Try-On</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inspiration">
        <Icon 
          src={<VectorIcon family={MaterialIcons} name="lightbulb-outline" />} 
        />
        <Label>Inspiration</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon 
          src={<VectorIcon family={MaterialIcons} name="person-outline" />} 
        />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
