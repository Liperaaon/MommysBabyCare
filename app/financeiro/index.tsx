import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { db } from '@/firebase/config';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

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
  green: '#10b981',
  red: '#ef4444',
};

interface Transaction {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  date: Date;
  refId?: string; // para income será o client_id
}

export default function FinanceiroScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  
  // Totais
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const loadData = async (month: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const startOfMonth = month.startOf('month').toISOString();
      const endOfMonth = month.endOf('month').toISOString();
      
      const txs: Transaction[] = [];
      let totalInc = 0;
      let totalExp = 0;

      // 1. Buscar Receitas (Clientes criados no mês)
      // OBS: Estamos assumindo que a receita entra na data de criação do cliente.
      const clientsSnap = await getDocs(query(collection(db, 'clients')));
      clientsSnap.forEach(d => {
        const c = d.data();
        if (c.created_at && c.created_at >= startOfMonth && c.created_at <= endOfMonth) {
          let val = 0;
          if (typeof c.amount === 'number') val = c.amount;
          else if (typeof c.amount === 'string') val = Number(c.amount.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          
          if (val > 0) {
            txs.push({
              id: `inc_${d.id}`,
              title: `Atendimento: ${c.mother_name}`,
              type: 'income',
              amount: val,
              date: new Date(c.created_at),
              refId: d.id,
            });
            totalInc += val;
          }
        }
      });

      // 2. Buscar Despesas
      const expensesSnap = await getDocs(query(collection(db, 'expenses')));
      expensesSnap.forEach(d => {
        const e = d.data();
        if (e.date && e.date >= startOfMonth && e.date <= endOfMonth) {
          const val = Number(e.amount) || 0;
          txs.push({
            id: d.id, // O ID real da expense para poder deletar
            title: e.title || 'Despesa',
            type: 'expense',
            amount: val,
            date: new Date(e.date),
          });
          totalExp += val;
        }
      });

      // Ordenar por data decrescente
      txs.sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(txs);
      setIncome(totalInc);
      setExpense(totalExp);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(currentMonth);
    }, [currentMonth])
  );

  const prevMonth = () => setCurrentMonth((prev: dayjs.Dayjs) => prev.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth((prev: dayjs.Dayjs) => prev.add(1, 'month'));

  const handleDeleteExpense = (id: string, title: string) => {
    Alert.alert('Excluir Despesa', `Deseja realmente excluir "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'expenses', id));
            loadData(currentMonth);
          } catch(e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
      }}
    ]);
  };

  const handleDeleteIncome = (clientId: string, title: string) => {
    Alert.alert('Excluir Atendimento', `Deseja excluir "${title}"? Isso removerá o cliente e o valor dele do seu financeiro.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'clients', clientId));
            loadData(currentMonth);
          } catch(e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível excluir o cliente.');
          }
      }}
    ]);
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.dark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Financeiro</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/financeiro/despesa' as any)}>
          <Ionicons name="add" size={20} color={T.white} />
        </TouchableOpacity>
      </View>

      {/* MONTH SELECTOR */}
      <View style={s.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={s.monthBtn}>
          <Ionicons name="chevron-back" size={20} color={T.mid} />
        </TouchableOpacity>
        <Text style={s.monthText}>{currentMonth.format('MMMM YYYY')}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.monthBtn}>
          <Ionicons name="chevron-forward" size={20} color={T.mid} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* CARDS RESUMO */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Lucro Líquido</Text>
          <Text style={s.balanceValue}>{formatBRL(income - expense)}</Text>
        </View>

        <View style={s.cardsRow}>
          <View style={[s.smallCard, { borderBottomColor: T.green }]}>
            <View style={s.cardIconRow}>
              <Ionicons name="arrow-down-circle" size={20} color={T.green} />
              <Text style={s.cardLabel}>Entradas</Text>
            </View>
            <Text style={s.cardValue}>{formatBRL(income)}</Text>
          </View>
          
          <View style={[s.smallCard, { borderBottomColor: T.red }]}>
            <View style={s.cardIconRow}>
              <Ionicons name="arrow-up-circle" size={20} color={T.red} />
              <Text style={s.cardLabel}>Saídas</Text>
            </View>
            <Text style={s.cardValue}>{formatBRL(expense)}</Text>
          </View>
        </View>

        {/* TRANSACTIONS LIST */}
        <Text style={s.sectionTitle}>Histórico do Mês</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={T.rose500} style={{ marginTop: 40 }} />
        ) : transactions.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={T.rose200} />
            <Text style={s.emptyText}>Nenhuma movimentação neste mês.</Text>
          </View>
        ) : (
          <View style={s.txContainer}>
            {transactions.map((tx, idx) => (
              <View key={tx.id} style={[s.txRow, idx < transactions.length - 1 && s.txBorder]}>
                <View style={[s.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                  <Ionicons name={tx.type === 'income' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'income' ? T.green : T.red} />
                </View>
                
                <View style={s.txInfo}>
                  <Text style={s.txTitle} numberOfLines={1}>{tx.title}</Text>
                  <Text style={s.txDate}>{dayjs(tx.date).format('DD/MM/YYYY')} - {dayjs(tx.date).format('HH:mm')}</Text>
                </View>

                <View style={s.txRight}>
                  <Text style={[s.txAmount, { color: tx.type === 'income' ? T.green : T.dark }]}>
                    {tx.type === 'expense' ? '-' : '+'} {formatBRL(tx.amount)}
                  </Text>
                  
                  {tx.type === 'expense' ? (
                    <TouchableOpacity onPress={() => handleDeleteExpense(tx.id, tx.title)} style={s.txAction}>
                      <Ionicons name="trash-outline" size={16} color={T.red} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => router.push(`/clientes/${tx.refId}` as any)} style={s.txAction}>
                        <Ionicons name="eye-outline" size={16} color={T.mid} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteIncome(tx.refId!, tx.title)} style={s.txAction}>
                        <Ionicons name="trash-outline" size={16} color={T.red} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.rose50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.dark },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.rose600, alignItems: 'center', justifyContent: 'center', shadowColor: T.rose600, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, marginBottom: 20 },
  monthBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: '700', color: T.dark, textTransform: 'capitalize' },

  content: { paddingHorizontal: 20, paddingBottom: 40 },
  
  balanceCard: { backgroundColor: T.dark, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12, shadowColor: T.dark, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceValue: { color: T.white, fontSize: 32, fontWeight: '800' },

  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  smallCard: { flex: 1, backgroundColor: T.white, borderRadius: 16, padding: 16, borderBottomWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardLabel: { fontSize: 13, color: T.mid, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800', color: T.dark },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: T.rose600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: T.mid, fontSize: 14, marginTop: 12 },

  txContainer: { backgroundColor: T.white, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: T.rose50 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '700', color: T.dark, marginBottom: 2 },
  txDate: { fontSize: 11, color: T.mid },
  txRight: { alignItems: 'flex-end', flexDirection: 'row', gap: 12 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  txAction: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.rose50, alignItems: 'center', justifyContent: 'center' },
});
