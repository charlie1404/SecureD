import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import { ArrowLeftIcon } from '../components/Icons';
import { useRouter } from '../router';
import { ColorTheme, useAppTheme } from '../theme';

export const QRScannerScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleQRScanned = (uri: string) => {
    try {
      const url = new URL(uri);
      const [type, label] = url.pathname.split('/').filter(Boolean);
      if (type !== 'totp') {
        throw new Error('Otp type not supported. Enter details Manually.');
      }
      const decodedLabel = decodeURIComponent(label);

      const name = decodedLabel;
      const seed = url.searchParams.get('secret') || '';

      let issuer = url.searchParams.get('issuer') || '';
      if(!issuer) {
        const parts = decodedLabel.split(':');
        if (parts.length > 1) {
          issuer = parts[0].trim();
        }
      }

      router.replace('add', { name, issuer, seed });
    } catch (err) {
      router.replace('add', {error: (err as Error).message || 'Invalid QR. Enter details Manually.'});
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (scanned) return;
      for (const code of codes) {
        const value = code.value;
        if (value && value.toLowerCase().startsWith('otpauth://')) {
          setScanned(true);
          handleQRScanned(value);
          break;
        }
      }
    },
  });

  return (
    <View style={[styles.flex1, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.goBack()} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Scan QR Code</Text>
        <View style={styles.iconButton} />
      </View>

      {!hasPermission ? (
        <View style={[styles.flex1, styles.centerContainer, { padding: 24 }]}>
          <Text style={[styles.title, { color: theme.text }]}>Camera Permission</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Camera access is required to scan TOTP QR codes.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 32 }]}
            onPress={requestPermission}
          >
            <Text style={[styles.primaryBtnText, { color: theme.white }]}>Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                borderWidth: 1,
                marginTop: 12,
              },
            ]}
            onPress={() => router.replace('add')}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>
              Enter Code Manually
            </Text>
          </TouchableOpacity>
        </View>
      ) : device == null ? (
        <View style={[styles.flex1, styles.centerContainer]}>
          <Text style={{ color: theme.subText }}>No Camera Found</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 20 }]}
            onPress={() => router.replace('add')}
          >
            <Text style={[styles.primaryBtnText, { color: theme.white }]}>Enter Code Manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flex1}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
          />

          {/* Viewfinder Target Mask */}
          <View style={styles.overlay}>
            <View style={[styles.unfocusedContainer, styles.unfocusedTop]} />
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.focusedContainer}>
                <View style={[styles.corner, styles.topLeft, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: theme.accent }]} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={[styles.unfocusedContainer, styles.unfocusedBottom]} />
          </View>

          {/* Instruction Card */}
          <View style={[styles.bottomOverlay, { backgroundColor: theme.card }]}>
            <Text style={[styles.instruction, { color: theme.text }]}>
              Point your camera at a TOTP QR code.
            </Text>
            <TouchableOpacity onPress={() => router.replace('add')} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: theme.accent }]}>
                Enter Code Manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    marginLeft: -12,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  primaryBtn: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700' },
  bottomOverlay: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    zIndex: 2,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  instruction: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  cancelBtn: { padding: 8 },
  cancelBtnText: { fontWeight: '700', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  unfocusedTop: { flex: 1.2 },
  unfocusedBottom: { flex: 1.8 },
  middleContainer: { flexDirection: 'row', height: 260 },
  focusedContainer: { width: 260, height: 260 },
  corner: { position: 'absolute', width: 40, height: 40 },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
});
