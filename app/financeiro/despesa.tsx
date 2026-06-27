import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const T = {
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  dark: '#2B2B2B',
  mid: '#6B7280',
  white: '#FFFFFF',
  border: 'rgba(225,29,72,0.14)',
  red: '#ef4444',
};

export default function AdicionarDespesa() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Formatar R$ enquanto digita
  const handleAmountChange = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length === 0) {
      setAmount('');
      return;
    }
    const numberVal = parseInt(clean, 10) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberVal);
    setAmount(formatted);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Erro', 'Preencha o título e o valor da despesa.');
      return;
    }

    setSaving(true);
    try {
      // Converter de R$ 1.000,00 para 1000.00
      const numericAmount = Number(amount.replace(/[^\d,]/g, '').replace(',', '.'));

      await addDoc(collection(db, 'expenses'), {
        title: title.trim(),
        amount: numericAmount,
        date: new Date().toISOString(), // Grava como ISO string para busca fácil
        created_at: serverTimestamp()
      });

      Alert.alert('Sucesso', 'Despesa salva com sucesso!');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="close" size={24} color={T.dark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nova Despesa</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          
          <View style={s.iconWrapper}>
            <Ionicons name="cart-outline" size={48} color={T.red} />
          </View>

          <Text style={s.label}>O que foi pago?</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Aluguel, Materiais, Gasolina"
            placeholderTextColor={T.mid}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <Text style={s.label}>Qual o valor?</Text>
          <TextInput
            style={[s.input, s.amountInput]}
            placeholder="R$ 0,00"
            placeholderTextColor={T.mid}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />

          <TouchableOpacity style={s.saveBtn} activeOpacity={0.8} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Salvando...' : 'Registrar Despesa'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.rose50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.dark },
  
  content: { padding: 24, alignItems: 'center' },
  iconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },

  label: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: T.dark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', backgroundColor: T.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, color: T.dark, borderWidth: 1, borderColor: T.border, marginBottom: 24 },
  amountInput: { fontSize: 24, fontWeight: '800', color: T.red },

  saveBtn: { width: '100%', backgroundColor: T.dark, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  saveBtnText: { color: T.white, fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
