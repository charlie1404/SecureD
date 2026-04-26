import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  withContainer?: boolean;
  containerBg?: string;
  style?: ViewStyle;
}

/**
 * AppLogo component rendered using react-native-svg.
 * Based on the SecureD padlock & biometric fingerprint branding from logo-build.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 64,
  primaryColor = '#FFFFFF',
  secondaryColor = '#EDA3AA',
  withContainer = false,
  containerBg = '#D13347',
  style,
}) => {
  // Aspect ratio of the logo is 160:230
  const width = size;
  const height = (size * 230) / 160;

  const svgContent = (
    <Svg width={width} height={height} viewBox="0 0 160 230">
      <Path
        d="M118 84.18206931238267 v-42 c0 -50.909425737116194 -76 -50.909425737116194 -76 0 v42"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={primaryColor}
      />
      <Path
        d="M4 150V150A76 76 0 0 1 156 150V150"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="16.713272917097697, 19.10088333382594, 202.94688542190062, 243.53626250628076"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={primaryColor}
      />
      <Path
        d="M20.88888888888889 197.7689914401579V150A59.111111111111114 59.111111111111114 0 0 1 139.11111111111111 150V197.7689914401579"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="151.8701482579567, 16.874460917550746, 8.437230458775373, 19.68687107047587, 84.37230458775373, 286.8658355983627"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={secondaryColor}
      />
      <Path
        d="M37.77777777777778 213.19243586551545V150A42.22222222222222 42.22222222222222 0 0 1 122.22222222222223 150V213.19243586551545"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="33.67388633473799, 18.132092641781995, 7.770896846477998, 23.312690539433994, 176.14032852016797, 264.2104927802519"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={primaryColor}
      />
      <Path
        d="M54.66666666666667 221.6534871602368V150A25.33333333333333 25.33333333333333 0 0 1 105.33333333333333 150V221.6534871602368"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="189.45988997970278, 17.8315190569132, 15.602579174799052, 227.35186797564333"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={secondaryColor}
      />
      <Path
        d="M71.55555555555556 225.5294072399929V150A8.444444444444443 8.444444444444443 0 0 1 88.44444444444444 150V225.5294072399929"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="35.51756382205993, 17.758781911029963, 124.31147337720974, 181.1395754925056"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke={primaryColor}
      />
    </Svg>
  );

  if (withContainer) {
    const containerSize = Math.max(width, height) * 1.5;
    const borderRadius = containerSize * 0.28;
    return (
      <View
        style={[
          styles.container,
          {
            width: containerSize,
            height: containerSize,
            borderRadius,
            backgroundColor: containerBg,
          },
          style,
        ]}
      >
        {svgContent}
      </View>
    );
  }

  return <View style={style}>{svgContent}</View>;
};

/**
 * AppLauncherIcon component rendered as a 1:1 square launcher mark.
 */
export const AppLauncherIcon: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 48,
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 230 230" style={style}>
      <Rect width="230" height="230" rx="52" fill="#D13347" />
      <Path
        d="M153 84.18206931238267 v-42 c0 -50.909425737116194 -76 -50.909425737116194 -76 0 v42"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#FFFFFF"
      />
      <Path
        d="M39 150V150A76 76 0 0 1 191 150V150"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="16.713272917097697, 19.10088333382594, 202.94688542190062, 243.53626250628076"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#FFFFFF"
      />
      <Path
        d="M55.888888888888886 197.7689914401579V150A59.111111111111114 59.111111111111114 0 0 1 174.11111111111111 150V197.7689914401579"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="151.8701482579567, 16.874460917550746, 8.437230458775373, 19.68687107047587, 84.37230458775373, 286.8658355983627"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#EDA3AA"
      />
      <Path
        d="M72.77777777777777 213.19243586551545V150A42.22222222222223 42.22222222222223 0 0 1 157.22222222222223 150V213.19243586551545"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="33.67388633473799, 18.132092641781995, 7.770896846477998, 23.312690539433994, 176.14032852016797, 264.2104927802519"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#FFFFFF"
      />
      <Path
        d="M89.66666666666667 221.6534871602368V150A25.33333333333333 25.33333333333333 0 0 1 140.33333333333331 150V221.6534871602368"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="189.45988997970278, 17.8315190569132, 15.602579174799052, 227.35186797564333"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#EDA3AA"
      />
      <Path
        d="M106.55555555555556 225.5294072399929V150A8.444444444444443 8.444444444444443 0 0 1 123.44444444444444 150V225.5294072399929"
        fill="none"
        strokeDashoffset="0"
        strokeDasharray="35.51756382205993, 17.758781911029963, 124.31147337720974, 181.1395754925056"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="8"
        stroke="#FFFFFF"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});

