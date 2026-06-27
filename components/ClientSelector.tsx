import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ClientSelectorProps {
  clients: any[];
  selectedClientId: number | null;
  onSelectClient: (client: any) => void;
  onRegisterNew: () => void;
}

export default function ClientSelector({ clients, selectedClientId, onSelectClient, onRegisterNew }: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c => 
    c.mother_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.baby_name && c.baby_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const handleSelect = (client: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectClient(client);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>1. Selecione a Cliente</Text>
      
      <Animated.View entering={FadeInUp.duration(400)} style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Pesquisar cliente..."
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
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchText}>Cliente não encontrada.</Text>
            <Pressable style={styles.registerBtn} onPress={onRegisterNew}>
              <Text style={styles.registerBtnText}>Cadastrar Nova Cliente</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const isSelected = selectedClientId === item.id;
          return (
            <AnimatedPressable 
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                { transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.clientName, isSelected && styles.textSelected]}>{item.mother_name}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="happy-outline" size={14} color={isSelected ? Colors.primary : "#888"} />
                  <Text style={[styles.clientInfo, isSelected && styles.textSelected]}>{item.baby_name || 'Bebê não informado'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={isSelected ? Colors.primary : "#888"} />
                  <Text style={[styles.clientInfo, isSelected && styles.textSelected]}>{item.phone || item.whatsapp || 'Sem contato'}</Text>
                </View>
              </View>
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </AnimatedPressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    height: 50,
    marginBottom: 16,
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
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF2F5',
  },
  cardContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  textSelected: {
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientInfo: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginLeft: 6,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptySearchText: {
    fontFamily: 'Nunito_500Medium',
    color: '#888',
    marginBottom: 16,
  },
  registerBtn: {
    backgroundColor: '#FFF2F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  registerBtnText: {
    color: Colors.primary,
    fontFamily: 'Nunito_700Bold',
  }
});
