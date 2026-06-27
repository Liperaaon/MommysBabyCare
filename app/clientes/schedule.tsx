import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { TextInputMask } from 'react-native-masked-text';
import { requestNotificationPermissions, scheduleReturnNotifications } from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleReturnScreen() {
  const router = useRouter();
  const { clientId, babyName } = useLocalSearchParams();

  const [form, setForm] = useState({
    date: '',
    time: '',
    type: 'consultoria', // consultoria or furo
    notes: ''
  });

  useEffect(() => {
    // Solicitar permissões ao abrir a tela
    requestNotificationPermissions();
  }, []);

  const handleSave = async () => {
    if (!form.date || form.date.length !== 10) {
      Alert.alert('Atenção', 'Digite uma data válida no formato DD/MM/AAAA.');
      return;
    }
    if (!form.time || form.time.length !== 5) {
      Alert.alert('Atenção', 'Digite uma hora válida no formato HH:MM.');
      return;
    }

    try {
      const collRef = collection(db, 'scheduled_returns');
      await addDoc(collRef, {
        client_id: clientId,
        attendance_type: form.type,
        return_date: form.date,
        return_time: form.time,
        notes: form.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      // Agendar Notificações Locais
      const bName = Array.isArray(babyName) ? babyName[0] : (babyName || 'o bebê');
      await scheduleReturnNotifications(form.date, form.time, bName);

      Alert.alert('Sucesso', 'Retorno agendado com sucesso! Os lembretes foram ativados.');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao agendar o retorno.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ 
        title: 'Agendar Retorno', 
        headerBackTitle: 'Voltar', 
        headerTintColor: Colors.primary,
        presentation: 'modal' // Make it appear as a modal
      }} />

      <View style={styles.header}>
        <Ionicons name="calendar" size={48} color={Colors.primary} />
        <Text style={styles.headerTitle}>Novo Agendamento</Text>
        <Text style={styles.headerSub}>Defina a data e hora. Nós te lembraremos automaticamente.</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Data do Retorno</Text>
        <TextInputMask 
          type={'datetime'} 
          options={{ format: 'DD/MM/YYYY' }} 
          style={styles.input} 
          value={form.date} 
          onChangeText={t => setForm(prev => ({ ...prev, date: t }))} 
          placeholder="DD/MM/AAAA" 
          keyboardType="numeric" 
          placeholderTextColor="#aaa" 
        />

        <Text style={styles.label}>Hora</Text>
        <TextInputMask 
          type={'datetime'} 
          options={{ format: 'HH:mm' }} 
          style={styles.input} 
          value={form.time} 
          onChangeText={t => setForm(prev => ({ ...prev, time: t }))} 
          placeholder="HH:MM" 
          keyboardType="numeric" 
          placeholderTextColor="#aaa" 
        />

        <Text style={styles.label}>Motivo do Retorno</Text>
        <View style={styles.radioGroup}>
          <Pressable 
            style={[styles.radioBtn, form.type === 'consultoria' && styles.radioBtnActive]}
            onPress={() => setForm(prev => ({ ...prev, type: 'consultoria' }))}
          >
            <Text style={[styles.radioText, form.type === 'consultoria' && styles.radioTextActive]}>Consultoria</Text>
          </Pressable>
          <Pressable 
            style={[styles.radioBtn, form.type === 'furo' && styles.radioBtnActive]}
            onPress={() => setForm(prev => ({ ...prev, type: 'furo' }))}
          >
            <Text style={[styles.radioText, form.type === 'furo' && styles.radioTextActive]}>Furo Humanizado</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Observações (Opcional)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={form.notes} 
          onChangeText={t => setForm(prev => ({ ...prev, notes: t }))} 
          placeholder="Ex: Acompanhamento da cicatrização..." 
          multiline 
          textAlignVertical="top" 
          placeholderTextColor="#aaa" 
        />
      </View>

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Confirmar Agendamento</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginTop: 12,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'Nunito_500Medium', color: Colors.text, marginBottom: 16 },
  textArea: { height: 80 },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  radioBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF2F5',
  },
  radioText: {
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  radioTextActive: {
    color: Colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
  },
  saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' }
});
