import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import { ArrowLeftIcon } from '../components/Icons';

export const QRScannerScreen = ({ theme, onCancel, onManualEntry, onScanned }: any) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    const onBackPress = () => {
      if (isScanning) {
        setIsScanning(false);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isScanning]);

  const startScanning = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (granted) setIsScanning(true);
    } else {
      setIsScanning(true);
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
          onScanned(value);
          break; // Stop after finding the first valid code
        }
      }
    }
  });

  return (
    <View style={styles.flex1}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => isScanning ? setIsScanning(false) : onCancel()} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Account</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={[styles.flex1, { backgroundColor: theme.background, justifyContent: 'center', padding: isScanning ? 0 : 24 }]}>
        {!isScanning ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[styles.title, { color: theme.text }]}>Link an account</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              Scan the QR code provided by your service, or enter the secret key manually.
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 40 }]}
              onPress={startScanning}
            >
              <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Scan QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                },
              ]}
              onPress={onManualEntry}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {device == null ? (
              <View style={[styles.flex1, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.subText }}>No Camera Found</Text>
              </View>
            ) : (
              <>
                <Camera
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={true}
                  codeScanner={codeScanner}
                />

                {/* Custom QR Scanner Overlay */}
                <View style={styles.overlay}>
                  <View style={[styles.unfocusedContainer, { flex: 1.5 }]} />
                  <View style={styles.middleContainer}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.focusedContainer}>
                      {/* Animated Corners for Scanner Box */}
                      <View style={[styles.corner, styles.topLeft, { borderColor: theme.accent }]} />
                      <View style={[styles.corner, styles.topRight, { borderColor: theme.accent }]} />
                      <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.accent }]} />
                      <View style={[styles.corner, styles.bottomRight, { borderColor: theme.accent }]} />
                    </View>
                    <View style={styles.unfocusedContainer} />
                  </View>
                  <View style={[styles.unfocusedContainer, { flex: 1 }]} />
                </View>
              </>
            )}

            <View style={[styles.bottomOverlay, { backgroundColor: theme.card, position: 'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
              <Text style={[styles.instruction, { color: theme.text }]}>
                Point your camera at a TOTP QR code.
              </Text>
              <TouchableOpacity onPress={() => setIsScanning(false)} style={{ padding: 8 }}>
                <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 16 }}>Cancel Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, marginLeft: -12 },

  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },

  primaryBtn: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },

  secondaryBtn: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '700' },

  bottomOverlay: { padding: 32, paddingBottom: 48, alignItems: 'center', zIndex: 2 },
  instruction: { fontSize: 14, marginBottom: 16, textAlign: 'center' },

  /* Scanner Overlay Styles */
  overlay: { zIndex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleContainer: { flexDirection: 'row', height: 260 },
  focusedContainer: { width: 260, height: 260 },
  corner: { position: 'absolute', width: 40, height: 40 },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },
});
