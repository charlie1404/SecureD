import React from 'react';
import { useNavigation, useRoute as useRNRoute, StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Route, RouteName, RouterContextType } from './types';

export const useRouter = (): RouterContextType => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  let routeName: RouteName = 'home';
  let routeParams: any;

  try {
    const rnRoute = useRNRoute();
    if (rnRoute) {
      routeName = (rnRoute.name as RouteName) || 'home';
      routeParams = rnRoute.params;
    }
  } catch {
    // Called outside a screen route context
  }

  return {
    currentRoute: {
      name: routeName,
      params: routeParams,
    },
    navigate: (name, params) => {
      navigation.navigate(name as any, params as any);
    },
    replace: (name, params) => {
      navigation.dispatch(StackActions.replace(name as string, params));
    },
    goBack: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    reset: (name, params) => {
      navigation.reset({
        index: 0,
        routes: [{ name, params: params as any }],
      });
    },
    canGoBack: navigation.canGoBack(),
  };
};

export const useRoute = <T = any>(): Route<T> => {
  const rnRoute = useRNRoute();
  return {
    name: rnRoute.name as RouteName,
    params: rnRoute.params as T | undefined,
  };
};

// Backwards-compatible Provider component (React Navigation's NavigationContainer handles state)
export const RouterProvider: React.FC<{ children: React.ReactNode; initialRoute?: RouteName }> = ({
  children,
}) => {
  return <>{children}</>;
};
