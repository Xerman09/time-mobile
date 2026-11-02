import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

export default function SignInScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [account, setAccount] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!account.trim() || !username.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(account.trim(), username.trim(), password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Official Brand Icon / Emblem */}
          <View style={styles.iconBox}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTextTeal}>WORK</Text>
              <Text style={styles.brandTextDark}>SHIFT</Text>
            </View>
            <Text style={styles.brandTagline}>WORKFORCE & SHIFT ATTENDANCE</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your employee dashboard</Text>

          {error ? (
            <View style={[styles.errorBanner, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
              <Feather name="alert-triangle" size={14} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Account Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ACCOUNT CODE</Text>
            <View style={styles.inputWrapper}>
              <Feather name="grid" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter account code"
                placeholderTextColor="#9ca3af"
                value={account}
                onChangeText={setAccount}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Username Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? 'eye' : 'eye-off'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" style={styles.btnArrow} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometric Button */}
          <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.7}>
            <Feather name="shield" size={18} color="#0d9488" />
            <Text style={styles.biometricText}>Biometric Login</Text>
          </TouchableOpacity>

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Need access? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Request Access</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'web' ? 24 : 16,
    paddingBottom: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },

  iconBox: {
    width: 58,
    height: 58,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 6px 18px rgba(12, 148, 136, 0.12)' } : {
      shadowColor: '#0c9488',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }),
  },
  brandLogo: {
    width: 38,
    height: 38,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextTeal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0c9488',
    letterSpacing: 1.2,
  },
  brandTextDark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1.2,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },

  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center', fontWeight: '500' },

  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0c9488',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },

  loginBtn: {
    backgroundColor: '#0c9488',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnArrow: {
    marginLeft: 8,
    marginTop: 1,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 14,
  },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    height: 48,
    borderRadius: 12,
    marginBottom: 20,
  },
  biometricText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  footerLink: {
    color: '#0c9488',
    fontSize: 13,
    fontWeight: '700',
  },
});
