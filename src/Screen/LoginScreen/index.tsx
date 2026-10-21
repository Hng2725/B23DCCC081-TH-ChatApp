import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Colors from '../../theme/colors';

function LoginScreen() {
  const navigation = useNavigation<any>();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ account: '', password: '' });

  const validate = () => {
    let valid = true;
    const newErrors = { account: '', password: '' };
    if (!account.trim()) {
      newErrors.account = 'Tài khoản không được để trống';
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleLogin = () => {
    if (!validate()) return;
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <AntDesign name="message1" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>ChatApp</Text>
          <Text style={styles.appSubtitle}>Kết nối mọi người, mọi lúc</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Tài khoản</Text>
          <View style={[styles.inputWrapper, !!errors.account && styles.inputError]}>
            <AntDesign name="user" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập tài khoản..."
              value={account}
              onChangeText={text => {
                setAccount(text);
                if (text.trim()) setErrors(e => ({ ...e, account: '' }));
              }}
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          {!!errors.account && (
            <View style={styles.errorRow}>
              <AntDesign name="exclamationcircleo" size={12} color={Colors.danger} />
              <Text style={styles.errorText}> {errors.account}</Text>
            </View>
          )}

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={[styles.inputWrapper, !!errors.password && styles.inputError]}>
            <AntDesign name="lock" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu..."
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (text.trim()) setErrors(e => ({ ...e, password: '' }));
              }}
              secureTextEntry={!showPassword}
              placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <AntDesign name={showPassword ? 'eye' : 'eyeo'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {!!errors.password && (
            <View style={styles.errorRow}>
              <AntDesign name="exclamationcircleo" size={12} color={Colors.danger} />
              <Text style={styles.errorText}> {errors.password}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  appSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, backgroundColor: Colors.inputBg, paddingHorizontal: 12,
  },
  inputError: { borderColor: Colors.danger },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, fontSize: 15, color: Colors.textPrimary },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorText: { color: Colors.danger, fontSize: 12 },
  loginButton: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', marginTop: 24,
    flexDirection: 'row', justifyContent: 'center',
  },
  loginButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;