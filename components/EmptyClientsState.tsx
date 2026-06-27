import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function EmptyClientsState() {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.title}>Nenhuma cliente cadastrada</Text>
      <Text style={styles.subtitle}>Para iniciar um atendimento, você precisa cadastrar uma mamãe primeiro.</Text>
      
      <Pressable style={styles.button} onPress={() => router.push('/clientes/create')}>
        <Text style={styles.buttonText}>Cadastrar Primeira Cliente</Text>
        <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.icon} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
  icon: {
    marginLeft: 8,
  }
});
