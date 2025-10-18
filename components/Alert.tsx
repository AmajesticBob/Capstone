import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../ThemeContext';
import { colors, getThemedColors } from '../theme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertProps {
  title?: string;
  message: string;
  buttons?: AlertButton[];
  visible: boolean;
  onDismiss: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  visible,
  onDismiss,
}) => {
  const { isDark, syncWithSystem } = useTheme();
  const themedColors = getThemedColors(isDark);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      supportedOrientations={['portrait']}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.centeredView}>
          {Platform.OS === 'ios' && syncWithSystem ? (
            <GlassView
              style={styles.alertBox}
              glassEffectStyle="regular"
              isInteractive={true}
            >
              {title && <Text style={styles.titleIOS}>{title}</Text>}
              <Text style={styles.messageIOS}>{message}</Text>
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.buttonIOS,
                      index < buttons.length - 1 && styles.buttonBorder,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonTextIOS,
                        button.style === 'cancel' && styles.buttonTextBold,
                        button.style === 'destructive' && styles.buttonTextDestructive,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassView>
          ) : (
            <View style={[styles.alertBox, { backgroundColor: themedColors.card }]}>
              {title && (
                <Text style={[styles.title, { color: themedColors.text }]}>{title}</Text>
              )}
              <Text style={[styles.message, { color: themedColors.textSecondary }]}>
                {message}
              </Text>
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      { backgroundColor: colors.primary },
                      index > 0 && styles.buttonMargin,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === 'destructive' && { color: '#EF4444' },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

// Hook for easier usage
export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    message: '',
  });

  const showAlert = (
    message: string,
    title?: string,
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      message,
      title,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <Alert
      visible={alertConfig.visible}
      message={alertConfig.message}
      title={alertConfig.title}
      buttons={alertConfig.buttons}
      onDismiss={hideAlert}
    />
  );

  return { showAlert, AlertComponent };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    width: '80%',
    maxWidth: 300,
  },
  alertBox: {
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleIOS: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageIOS: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonMargin: {
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIOS: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonTextIOS: {
    color: '#007AFF',
    fontSize: 16,
  },
  buttonTextBold: {
    fontWeight: '600',
  },
  buttonTextDestructive: {
    color: '#EF4444',
  },
});
