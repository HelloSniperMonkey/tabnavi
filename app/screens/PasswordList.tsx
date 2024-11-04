import React , {useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import List from '../components/List';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();
const windowWidth = Dimensions.get('window').width;

export default function PasswordList() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');

  const AllList = () => <List filter="" filterText={searchText} />;
  const WorkList = () => <List filter="work" filterText={searchText} />;
  const SocialList = () => <List filter="social" filterText={searchText} />;
  const BankingList = () => <List filter="banking" filterText={searchText} />;

  const handleKeystroke = (text) => {
    return <List filter="" filterText={text}/>
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Vault</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarScrollEnabled: windowWidth < 768,
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.tabIndicator,
          }}
        >
          <Tab.Screen name="All" component={AllList} />
          <Tab.Screen name="Work" component={WorkList} />
          <Tab.Screen name="Social" component={SocialList} />
          <Tab.Screen name="Banking" component={BankingList} />
        </Tab.Navigator>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.search} 
            placeholder='Search'
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewPassword')}
        >
          <Icon name="add" color="white" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  contentContainer: {
    flex: 1,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: '#fff',
  },
  tabIndicator: {
    backgroundColor: '#007AFF',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    marginRight: 16,
  },
  search: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});