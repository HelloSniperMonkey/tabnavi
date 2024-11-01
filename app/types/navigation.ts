export type RootStackParamList = {
    Login: undefined;
    TabNavigator: undefined;
    NewPassword: undefined;
  };
  
  export type TabParamList = {
    Passwords: undefined;
    Settings: undefined;
  };
  
  declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
  }