import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { currentUser } from '../../data/mockData';
import Colors from '../../theme/colors';

function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AntDesign name="setting" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView>
        {/* Thông tin tài khoản */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: currentUser.avatarColor }]}>
            <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <View style={styles.emailRow}>
              <AntDesign name="mail" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.profileEmail}>{currentUser.email}</Text>
            </View>
          </View>
          <AntDesign name="edit" size={18} color={Colors.primary} />
        </View>

        {/* Tùy chọn */}
        <Text style={styles.sectionTitle}>Tùy chọn</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#fff3e0' }]}>
                <AntDesign name="bells" size={18} color="#fa8c16" />
              </View>
              <Text style={styles.settingLabel}>Thông báo</Text>
            </View>
            <Switch
              value={notifyEnabled}
              onValueChange={setNotifyEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notifyEnabled ? Colors.primary : Colors.offline}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#f0f0f0' }]}>
                <AntDesign name="eye" size={18} color="#595959" />
              </View>
              <Text style={styles.settingLabel}>Chế độ tối</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={darkMode ? Colors.primary : Colors.offline}
            />
          </View>
        </View>

        {/* Thông tin ứng dụng */}
        <Text style={styles.sectionTitle}>Thông tin</Text>
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#e6f7ff' }]}>
                <AntDesign name="mobile1" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.settingLabel}>Phiên bản</Text>
            </View>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#f9f0ff' }]}>
                <AntDesign name="customerservice" size={18} color="#722ed1" />
              </View>
              <Text style={styles.settingLabel}>Hỗ trợ</Text>
            </View>
            <Text style={styles.infoValue}>support@chatapp.vn</Text>
          </View>
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <AntDesign name="logout" size={18} color={Colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 12, padding: 16, borderRadius: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 26, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  profileEmail: { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginHorizontal: 16, marginTop: 16, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  section: {
    backgroundColor: Colors.white, marginHorizontal: 12,
    borderRadius: 12, overflow: 'hidden',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  settingLabel: { fontSize: 15, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  infoValue: { fontSize: 13, color: Colors.textSecondary, maxWidth: '45%', textAlign: 'right' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12, marginTop: 20, marginBottom: 32,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.danger,
  },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
});

export default SettingsScreen;
