import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  Inventory: undefined;
  AddProduct: undefined;
  Clients: undefined;
  AddClient: undefined;
  ClientProfile: { clientId: string };
  POS: undefined;
  Checkout: undefined;
  SaleDetail: { saleId: string };
  Collections: undefined;
  ReportsTab: undefined;
  Simulation: undefined;
  SalesHistoryFull: { cashboxId?: string } | undefined;
};

// Combine all for global usage if needed, or keep separate
export type RootStackParamList = AuthStackParamList & AppStackParamList;

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
