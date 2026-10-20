import { NativeModules } from 'react-native';

export interface AppVersionInfo {
  versionName: string;
  versionCode: number | string;
  applicationId: string;
}

export const getAppVersionInfo = (): AppVersionInfo => {
  const constants =
    (typeof NativeModules.StorageModule?.getConstants === 'function'
      ? NativeModules.StorageModule.getConstants()
      : NativeModules.StorageModule) || {};

  return {
    versionName: constants.versionName || '1.0.0',
    versionCode: constants.versionCode || 1,
    applicationId: constants.applicationId || 'com.secured',
  };
};

