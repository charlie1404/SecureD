import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable, Vibration } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import { AccountWithTOTP } from '../types';
import { CheckIcon } from './Icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const TokenCard = ({ item, theme, onPress }: { item: AccountWithTOTP, theme: any, onPress?: () => void }) => {
  const animatedProgress = useRef(new Animated.Value(1)).current;
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const startAnimation = () => {
      const now = Date.now();
      const msRemaining = 30000 - (now % 30000);

      animatedProgress.setValue(msRemaining / 30000);
      Animated.timing(animatedProgress, {
        toValue: 0,
        duration: msRemaining,
        useNativeDriver: false, // Required for SVG strokeDashoffset and color interpolation
        easing: Easing.linear,
      }).start();

      timeout = setTimeout(startAnimation, msRemaining);
    };

    startAnimation();

    return () => clearTimeout(timeout);
  }, [animatedProgress]);

  const formattedTotp = item.totp.length === 6
    ? `${item.totp.slice(0, 3)} ${item.totp.slice(3)}`
    : item.totp;

  // Smooth color transition: Blue (30s-6.0s) -> Transition (6.0s-5.8s) -> Red (5.8s-0s)
  const animatedColor = animatedProgress.interpolate({
    inputRange: [0, 5.8 / 30, 6.0 / 30, 1],
    outputRange: [theme.danger, theme.danger, theme.accent, theme.accent]
  });

  const radius = 22;
  const strokeWidth = 2.5; // Thin ring around the avatar
  const circumference = 2 * Math.PI * radius;

  // Animate the pie slice shrinking
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0]
  });

  const handleLongPress = () => {
    Clipboard.setString(item.totp);
    Vibration.vibrate(50);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      android_ripple={{ color: theme.subText + '30' }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
      ]}
    >
      <View style={styles.issuerRow}>
        <View style={styles.avatarContainer}>
          {/* Rotate -90deg so the ring starts from the top (12 o'clock) */}
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
            <Svg width="48" height="48" viewBox="0 0 48 48">
              {/* Subtle background track */}
              <Circle
                cx="24" cy="24" r={radius}
                stroke={theme.subText + '20'}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Animated foreground ring */}
              <AnimatedCircle
                cx="24" cy="24" r={radius}
                stroke={animatedColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </View>

          <View style={[styles.issuerIcon, { backgroundColor: theme.accentSurface || (theme.accent + '18') }]}>
            {copied ? (
              <CheckIcon color={theme.accent} size={20} />
            ) : (
              <Text style={[styles.issuerIconText, { color: theme.accent }]}>
                {(item.issuer || item.name || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.issuerName, { color: theme.text }]} numberOfLines={1}>
              {item.issuer || 'Account'}
            </Text>
            {item.secureNotes && item.secureNotes.length > 0 ? (
              <View style={[styles.metaDot, { backgroundColor: theme.accentSecondary }]} />
            ) : null}
          </View>
          <Text style={[styles.accountName, { color: theme.subText }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </View>

      <View style={styles.totpCompactRow}>
        <Text style={[styles.totpCodeCompact, { color: theme.accent }]}>
          {formattedTotp}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 18, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issuerRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  avatarContainer: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  issuerIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  issuerIconText: { fontSize: 18, fontWeight: '700' },
  issuerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  accountName: { fontSize: 13, fontWeight: '500' },
  metaDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 8 },
  totpCompactRow: { flexDirection: 'row', alignItems: 'center' },
  totpCodeCompact: { fontSize: 28, fontWeight: '500', letterSpacing: 2 },
});
