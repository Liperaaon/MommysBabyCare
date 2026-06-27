import { StyleSheet, View, Text, FlatList, Pressable, Alert, TextInput } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCallback, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const loadClients = async () => {
    try {
      const q = query(collection(db, 'clients'), orderBy('mother_name', 'asc'));
      const querySnapshot = await getDocs(q);
      const result: any[] = [];
      querySnapshot.forEach((doc) => {
        result.push({ id: doc.id, ...doc.data() });
      });
      setClients(result);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const filteredClients = clients.filter(c => 
    c.mother_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.baby_name && c.baby_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const getStatus = (client: any) => {
    if (client.next_return) {
      return { label: 'Retorno Agendado', color: '#FFB020', bg: '#FFF8E1' }; 
    } else if (client.cons_count > 0 || client.furo_count > 0) {
      return { label: 'Concluído', color: '#17A2B8', bg: '#E0F7FA' }; 
    } else {
      return { label: 'Em acompanhamento', color: '#28A745', bg: '#E8F5E9' }; 
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Meus Clientes', 
        headerBackTitle: 'Voltar', 
        headerTintColor: Colors.primary,
        headerRight: () => (
          <Pressable onPress={() => router.push('/clientes/create')} style={{ marginRight: 15 }}>
            <Ionicons name="add" size={28} color={Colors.primary} />
          </Pressable>
        )
      }} />
      
      <Animated.View entering={FadeInUp.duration(400)} style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar por mãe ou bebê..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </Pressable>
        )}
      </Animated.View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyContainer}>
            <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={64} color="#ccc" />
            <Text style={styles.emptyText}>{searchQuery ? 'Nenhum resultado.' : 'Nenhuma cliente cadastrada.'}</Text>
            {!searchQuery && <Text style={styles.emptySub}>Toque no + para adicionar a primeira mamãe.</Text>}
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const status = getStatus(item);
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
              <Pressable 
                style={styles.card} 
                onPress={() => router.push(`/clientes/${item.id}`)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.clientName}>{item.mother_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="happy-outline" size={16} color="#888" />
                    <Text style={styles.clientInfo}>{item.baby_name || 'Não informado'}</Text>
                  </View>
                  
                  {item.next_return ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#FFB020" />
                      <Text style={[styles.clientInfo, { color: '#FFB020', fontFamily: 'Nunito_700Bold' }]}>
                        Próx: {item.next_return}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={16} color="#888" />
                      <Text style={styles.clientInfo}>{item.phone || item.whatsapp || 'Sem contato'}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
              </Pressable>
            </Animated.View>
          );
        }}
      />
      
      <Pressable style={styles.fab} onPress={() => router.push('/clientes/create')}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
  },
  clearSearchBtn: {
    padding: 5,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
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