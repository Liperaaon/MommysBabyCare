import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { useState, useCallback } from 'react';
import { db } from '@/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import EmptyClientsState from '@/components/EmptyClientsState';
import ClientSelector from '@/components/ClientSelector';
import AttendanceTypeSelector, { AttendanceType } from '@/components/AttendanceTypeSelector';

export default function NewServiceScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<AttendanceType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'clients'), orderBy('mother_name', 'asc'));
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAttendance = () => {
    if (!selectedClient || !selectedType) return;

    const params = {
      clientId: selectedClient.id,
      clientName: selectedClient.mother_name,
      babyName: selectedClient.baby_name || ''
    };

    if (selectedType === 'consultoria') {
      router.push({ pathname: '/consultorias/create', params });
    } else if (selectedType === 'furo') {
      router.push({ pathname: '/furos/create', params });
    }
  };

  if (isLoading) {
    return <View style={styles.container} />; // Or a spinner
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Novo Atendimento', 
        headerBackTitle: 'Voltar', 
        headerTintColor: Colors.primary 
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Animated.View entering={FadeInUp.duration(400)} style={styles.headerInfo}>
          <Text style={styles.headerText}>Inicie um novo atendimento para uma cliente cadastrada.</Text>
        </Animated.View>

        {clients.length === 0 ? (
          <EmptyClientsState />
        ) : (
          <>
            <ClientSelector 
              clients={clients} 
              selectedClientId={selectedClient?.id || null} 
              onSelectClient={setSelectedClient} 
              onRegisterNew={() => router.push('/clientes/create')}
            />

            {selectedClient && (
              <AttendanceTypeSelector 
                selectedType={selectedType}
                onSelectType={setSelectedType}
              />
            )}

            {selectedClient && selectedType && (
              <Animated.View entering={FadeInUp.duration(300)}>
                <Pressable style={styles.startBtn} onPress={handleStartAttendance}>
                  <Text style={styles.startBtnText}>Iniciar Atendimento</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.startIcon} />
                </Pressable>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  startBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },
  startIcon: {
    marginLeft: 10,
  }
});
