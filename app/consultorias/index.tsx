import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCallback, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ConsultationsScreen() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadConsultations();
    }, [])
  );

  const loadConsultations = async () => {
    try {
      // 1. Fetch clients for mapping names
      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clientsMap: any = {};
      clientsSnap.forEach(d => {
        clientsMap[d.id] = d.data();
      });

      // 2. Fetch consultations
      const q = query(collection(db, 'maternal_consultations'), orderBy('created_at', 'desc'));
      const consSnap = await getDocs(q);
      
      const result: any[] = [];
      consSnap.forEach(d => {
        const data = d.data();
        const c = clientsMap[data.client_id] || {};
        result.push({
          id: d.id,
          client_id: data.client_id,
          date: data.date,
          mother_name: c.mother_name || 'Desconhecida',
          baby_name: c.baby_name || ''
        });
      });
      
      setConsultations(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Fichas de Consultoria', headerBackTitle: 'Voltar', headerTintColor: Colors.primary }} />
      
      <FlatList
        data={consultations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma ficha registrada.</Text>
            <Text style={styles.emptySub}>Toque no + para iniciar uma consultoria.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable 
              style={styles.card} 
              onPress={() => router.push(`/clientes/${item.client_id}`)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.clientName}>{item.mother_name}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#888" />
                  <Text style={styles.clientInfo}>Realizada em: {item.date}</Text>
                </View>
                {item.baby_name ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="happy-outline" size={16} color="#888" />
                    <Text style={styles.clientInfo}>Bebê: {item.baby_name}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </Pressable>
          </Animated.View>
        )}
      />
      
      {/* FAB direciona para 'Novo Atendimento' para forçar a escolha da cliente primeiro */}
      <Pressable style={styles.fab} onPress={() => router.push('/novo-atendimento')}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#888',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#aaa',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientInfo: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  }
});
