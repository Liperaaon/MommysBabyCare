import { StyleSheet, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Resultados e Relatórios', headerBackTitle: 'Voltar', headerTintColor: Colors.primary }} />
      <Text style={styles.text}>Tela: Resultados e Relatórios</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  }
});
