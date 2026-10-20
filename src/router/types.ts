export type RootStackParamList = {
  unlock: undefined;
  onboarding: undefined;
  home: undefined;
  add: { name?: string; issuer?: string; seed?: string } | undefined;
  qr: undefined;
  notes: undefined;
  settings: undefined;
};

export type RouteName = keyof RootStackParamList;

export interface Route<T = any> {
  name: RouteName;
  params?: T;
}

export interface RouterContextType {
  currentRoute: Route;
  navigate: <T extends RouteName>(name: T, params?: RootStackParamList[T]) => void;
  goBack: () => void;
  replace: <T extends RouteName>(name: T, params?: RootStackParamList[T]) => void;
  reset: <T extends RouteName>(name: T, params?: RootStackParamList[T]) => void;
  canGoBack: boolean;
}
