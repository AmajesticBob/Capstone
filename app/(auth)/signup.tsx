import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../ThemeContext';
import { colors, getThemedColors } from '../../theme';
import { USERNAME_REGEX, EMAIL_REGEX, PASSWORD_MIN_LENGTH } from '../../constants/validation';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, checkUsernameAvailability } = useAuth();
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation states
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
    };
  }, []);

  // Debounced username availability check
  useEffect(() => {
    if (!username) {
      setUsernameValid(null);
      return;
    }

    // First check regex
    if (!USERNAME_REGEX.test(username)) {
      setUsernameValid(false);
      return;
    }

    // Clear previous timer
    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }

    setUsernameChecking(true);
    usernameCheckTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      const isAvailable = await checkUsernameAvailability(username);
      if (isMountedRef.current) {
        setUsernameValid(isAvailable);
        setUsernameChecking(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
    };
  }, [username, checkUsernameAvailability]);

  // Email validation
  useEffect(() => {
    if (!email) {
      setEmailValid(null);
      return;
    }
    setEmailValid(EMAIL_REGEX.test(email));
  }, [email]);

  // Password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  const handleSignup = async () => {
    setError('');

    // Validate all fields
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!usernameValid) {
      setError('Please choose a valid and available username');
      return;
    }

    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email.trim(), password, username.trim());

    if (error) {
      setError(error.message || 'Failed to sign up');
      setLoading(false);
    } else {
      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: email.trim() },
      });
    }
  };

  const getValidationIcon = (valid: boolean | null, checking: boolean = false) => {
    if (checking) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    if (valid === null) return null;
    return (
      <MaterialIcons
        name={valid ? 'check-circle' : 'cancel'}
        size={20}
        color={valid ? '#10B981' : '#EF4444'}
      />
    );
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return themedColors.border;
    if (passwordStrength === 'weak') return '#EF4444';
    if (passwordStrength === 'medium') return '#F59E0B';
    return '#10B981';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={themedColors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: themedColors.text }]}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themedColors.text }]}>Username</Text>
              <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
                <MaterialIcons name="person" size={20} color={themedColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: themedColors.text, backgroundColor: 'transparent' }]}
                  placeholder="3-15 characters (a-z, 0-9, _)"
                  placeholderTextColor={themedColors.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  textContentType="username"
                />
                {getValidationIcon(usernameValid, usernameChecking)}
              </View>
              {username && !usernameChecking && usernameValid === false && (
                <Text style={styles.helperText}>
                  {!USERNAME_REGEX.test(username)
                    ? 'Username must be 3-15 characters (letters, numbers, underscore)'
                    : 'Username is already taken'}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themedColors.text }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
                <MaterialIcons name="email" size={20} color={themedColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: themedColors.text, backgroundColor: 'transparent' }]}
                  placeholder="Enter your email"
                  placeholderTextColor={themedColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                {getValidationIcon(emailValid)}
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themedColors.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
                <MaterialIcons name="lock" size={20} color={themedColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: themedColors.text, backgroundColor: 'transparent' }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={themedColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={themedColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {password && passwordStrength && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBars}>
                    <View
                      style={[
                        styles.strengthBar,
                        { backgroundColor: getPasswordStrengthColor() },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength === 'medium' || passwordStrength === 'strong'
                              ? getPasswordStrengthColor()
                              : themedColors.border,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength === 'strong'
                              ? getPasswordStrengthColor()
                              : themedColors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.strengthText, { color: getPasswordStrengthColor() }]}
                  >
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themedColors.text }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
                <MaterialIcons name="lock" size={20} color={themedColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: themedColors.text, backgroundColor: 'transparent' }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={themedColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={themedColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: colors.primary }]}
              onPress={handleSignup}
              disabled={loading || usernameChecking}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: themedColors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    letterSpacing: 0,
  },
  helperText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
