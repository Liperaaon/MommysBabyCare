import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TextInputMask } from 'react-native-masked-text';

export default function CreateClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [form, setForm] = useState({
    mother_name: '', cpf: '', phone: '', whatsapp: '',
    address: '', city: '', baby_name: '', birth_date: '',
    weight: '', observations: '', amount: '', payment_method: ''
  });

  const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Crédito', 'Débito', 'Transferência'];

  const clientId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const client = docSnap.data();
        const parsedClient: any = {};
        Object.keys(form).forEach(key => parsedClient[key] = client[key] || '');
        setForm(parsedClient);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!form.mother_name.trim()) {
      Alert.alert('Atenção', 'O nome da mãe é obrigatório para cadastrar.');
      return;
    }

    try {
      // Converte valor monetário 'R$ 150,00' -> 150.00
      let numericAmount = 0;
      if (form.amount) {
        numericAmount = parseFloat(form.amount.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
      }

      const clientData = {
        mother_name: form.mother_name,
        cpf: form.cpf,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        city: form.city,
        baby_name: form.baby_name,
        birth_date: form.birth_date,
        weight: form.weight,
        observations: form.observations,
        amount: numericAmount,
        payment_method: form.payment_method,
        updated_at: new Date().toISOString()
      };

      if (clientId) {
        const docRef = doc(db, 'clients', clientId);
        await updateDoc(docRef, clientData);
        Alert.alert('Sucesso', 'Ficha atualizada com sucesso!');
        router.back();
      } else {
        const collRef = collection(db, 'clients');
        const newDoc = await addDoc(collRef, {
          ...clientData,
          created_at: new Date().toISOString()
        });
        
        Alert.alert(
          'Sucesso', 
          'Paciente cadastrada com sucesso! Deseja agendar a primeira consulta ou um retorno agora?', 
          [
            { text: 'Não, voltar', style: 'cancel', onPress: () => router.back() },
            { 
              text: 'Sim, Agendar', 
              onPress: () => {
                router.back(); // Volta pra home ou pros clientes primeiro
                setTimeout(() => {
                  router.push(`/clientes/schedule?clientId=${newDoc.id}&babyName=${form.baby_name}` as any);
                }, 100);
              }
            }
          ]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o cadastro.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: id ? 'Editar Cadastro' : 'Novo Cadastro', headerBackTitle: 'Voltar', headerTintColor: Colors.primary }} />
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados da Mãe</Text>
          
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput style={styles.input} value={form.mother_name} onChangeText={t => handleChange('mother_name', t)} placeholder="Ex: Maria Silva" placeholderTextColor="#aaa" />

          <Text style={styles.label}>CPF</Text>
          <TextInputMask type={'cpf'} style={styles.input} value={form.cpf} onChangeText={t => handleChange('cpf', t)} placeholder="000.000.000-00" keyboardType="numeric" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Telefone</Text>
          <TextInputMask type={'cel-phone'} options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }} style={styles.input} value={form.phone} onChangeText={t => handleChange('phone', t)} placeholder="(00) 00000-0000" keyboardType="phone-pad" placeholderTextColor="#aaa" />
          
          <Text style={styles.label}>WhatsApp</Text>
          <TextInputMask type={'cel-phone'} options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }} style={styles.input} value={form.whatsapp} onChangeText={t => handleChange('whatsapp', t)} placeholder="(00) 00000-0000" keyboardType="phone-pad" placeholderTextColor="#aaa" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          
          <Text style={styles.label}>Cidade / Estado</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={t => handleChange('city', t)} placeholder="Ex: São Paulo - SP" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Endereço Completo</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.address} onChangeText={t => handleChange('address', t)} placeholder="Rua, Número, Bairro, Complemento" multiline textAlignVertical="top" placeholderTextColor="#aaa" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados do Bebê</Text>
          
          <Text style={styles.label}>Nome do Bebê</Text>
          <TextInput style={styles.input} value={form.baby_name} onChangeText={t => handleChange('baby_name', t)} placeholder="Ex: Enzo" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Data de Nascimento / Previsão</Text>
          <TextInputMask type={'datetime'} options={{ format: 'DD/MM/YYYY' }} style={styles.input} value={form.birth_date} onChangeText={t => handleChange('birth_date', t)} placeholder="DD/MM/AAAA" keyboardType="numeric" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Peso Atual (kg)</Text>
          <TextInput style={styles.input} value={form.weight} onChangeText={t => handleChange('weight', t)} placeholder="Ex: 3.5" keyboardType="numeric" placeholderTextColor="#aaa" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Controle Financeiro</Text>
          
          <Text style={styles.label}>Valor do Atendimento</Text>
          <TextInputMask
            type={'money'}
            options={{ precision: 2, separator: ',', delimiter: '.', unit: 'R$ ', suffixUnit: '' }}
            style={styles.input}
            value={form.amount}
            onChangeText={t => handleChange('amount', t)}
            placeholder="R$ 0,00"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Forma de Pagamento</Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map(method => (
              <Pressable
                key={method}
                style={[styles.paymentBtn, form.payment_method === method && styles.paymentBtnActive]}
                onPress={() => handleChange('payment_method', method)}
              >
                <Text style={[styles.paymentBtnText, form.payment_method === method && styles.paymentBtnTextActive]}>
                  {method}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Observações Gerais</Text>
          <TextInput style={[styles.input, styles.textArea]} value={form.observations} onChangeText={t => handleChange('observations', t)} placeholder="Histórico, restrições, particularidades..." multiline textAlignVertical="top" placeholderTextColor="#aaa" />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{id ? 'Atualizar Dados' : 'Salvar Cliente'}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.primary, marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'Nunito_500Medium', color: Colors.text, marginBottom: 16 },
  textArea: { height: 100 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, marginBottom: 16 },
  paymentBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F9F9F9' },
  paymentBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(255,183,197,0.15)' },
  paymentBtnText: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#555' },
  paymentBtnTextActive: { color: Colors.primary, fontFamily: 'Nunito_700Bold' },
  saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' }
});
