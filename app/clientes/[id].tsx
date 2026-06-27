import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { useState, useCallback } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { generateAndSharePdf } from '@/services/PdfService';

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = Array.isArray(id) ? id[0] : id;

  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        loadData();
      }
    }, [clientId])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Load client info
      const clientSnap = await getDoc(doc(db, 'clients', clientId));
      if (!clientSnap.exists()) {
        setIsLoading(false);
        return;
      }
      setClient({ id: clientSnap.id, ...clientSnap.data() });

      // 2. Load Consultations
      const consQ = query(collection(db, 'maternal_consultations'), where('client_id', '==', clientId));
      const consSnap = await getDocs(consQ);
      const formattedConsultations = consSnap.docs.map(d => {
        const c = d.data();
        return {
          id: `c_${d.id}`,
          type: 'Consultoria Materna',
          date: c.date,
          icon: '🍼',
          color: '#FFF2F5',
          details: c.action_plan || 'Consultoria realizada.'
        };
      });

      // 3. Load Furos
      const furoQ = query(collection(db, 'furo_humanizado'), where('client_id', '==', clientId));
      const furoSnap = await getDocs(furoQ);
      const formattedFuros = furoSnap.docs.map(d => {
        const f = d.data();
        return {
          id: `f_${d.id}`,
          type: 'Furo Humanizado',
          date: f.date,
          icon: '💎',
          color: '#E8F4FD',
          details: f.procedure_notes || f.local || 'Furo realizado.'
        };
      });

      // 4. Load Scheduled Returns
      const retQ = query(collection(db, 'scheduled_returns'), where('client_id', '==', clientId));
      const retSnap = await getDocs(retQ);
      const formattedReturns = retSnap.docs.map(d => {
        const r = d.data();
        return {
          id: `r_${d.id}`,
          type: r.attendance_type === 'furo' ? 'Retorno (Furo)' : 'Retorno',
          date: r.return_date,
          time: r.return_time,
          icon: '📅',
          color: '#FFFDF7',
          details: r.notes || 'Acompanhamento agendado.'
        };
      });

      // Merge and sort (this is a simplified string sort since DD/MM/YYYY is hard to sort without parsing, 
      // but assuming standard usage for display. In production, we'd parse DD/MM/YYYY to timestamps).
      const allHistory = [...formattedConsultations, ...formattedFuros, ...formattedReturns].sort((a, b) => {
        const parseDate = (dStr: string) => {
          if(!dStr) return 0;
          const parts = dStr.split('/');
          if(parts.length !== 3) return 0;
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        };
        return parseDate(b.date) - parseDate(a.date); // Descending
      });

      setHistory(allHistory);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !client) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleGeneratePdf = async (item: any) => {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #FFB7C5;">${item.type}</h1>
            <h2>Cliente: ${client.mother_name}</h2>
            ${client.baby_name ? `<h3>Bebê: ${client.baby_name}</h3>` : ''}
            <p><strong>Data:</strong> ${item.date} ${item.time ? `às ${item.time}` : ''}</p>
            <hr />
            <h3>Detalhes:</h3>
            <p>${item.details.replace(/\n/g, '<br/>')}</p>
          </body>
        </html>
      `;
      await generateAndSharePdf(htmlContent, `Ficha_${item.type}_${client.mother_name}.pdf`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Perfil da Cliente', 
        headerBackTitle: 'Voltar', 
        headerTintColor: Colors.primary,
        headerRight: () => (
          <Pressable onPress={() => router.push({ pathname: '/clientes/create', params: { id: client.id } })}>
            <Ionicons name="pencil" size={24} color={Colors.primary} />
          </Pressable>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Profile */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.mother_name.charAt(0)}</Text>
          </View>
          <Text style={styles.motherName}>{client.mother_name}</Text>
          <Text style={styles.babyName}>Bebê: {client.baby_name || 'Não informado'}</Text>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color="#888" />
            <Text style={styles.contactText}>{client.phone || client.whatsapp || 'Sem telefone'}</Text>
          </View>
        </Animated.View>

        {/* History Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Histórico de Atendimentos</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>Nenhum atendimento registrado ainda.</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInUp.delay(index * 100).duration(300)} style={[styles.historyCard, { backgroundColor: item.color }]}>
              <View style={styles.historyIcon}>
                <Text style={styles.historyEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyType}>{item.type}</Text>
                <Text style={styles.historyDate}>{item.date} {item.time ? `às ${item.time}` : ''}</Text>
                <Text style={styles.historyDetails} numberOfLines={2}>{item.details}</Text>
              </View>
              {item.type !== 'Retorno' && item.type !== 'Retorno (Furo)' && (
                <Pressable style={styles.pdfBtn} onPress={() => handleGeneratePdf(item)}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                </Pressable>
              )}
            </Animated.View>
          ))
        )}

      </ScrollView>

      {/* Floating Action Button for Schedule */}
      <Pressable 
        style={styles.fab} 
        onPress={() => router.push({ pathname: '/clientes/schedule', params: { clientId: client.id, babyName: client.baby_name } })}
      >
        <Ionicons name="calendar-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>Agendar Retorno</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.primary,
  },
  motherName: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
  },
  babyName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactText: {
    marginLeft: 6,
    fontFamily: 'Nunito_600SemiBold',
    color: '#888',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
  },
  historyCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyEmoji: {
    fontSize: 24,
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  historyDate: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: '#888',
    marginTop: 2,
  },
  historyDetails: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#555',
    marginTop: 4,
  },
  pdfBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#aaa',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    marginLeft: 8,
  }
});
