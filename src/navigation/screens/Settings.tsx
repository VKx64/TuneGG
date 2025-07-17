import { Text } from '@react-navigation/elements';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function Settings() {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    minWidth: 120,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
