import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AttendanceType = 'consultoria' | 'furo' | null;

interface AttendanceTypeSelectorProps {
  selectedType: AttendanceType;
  onSelectType: (type: AttendanceType) => void;
}

export default function AttendanceTypeSelector({ selectedType, onSelectType }: AttendanceTypeSelectorProps) {
  
  const handleSelect = (type: AttendanceType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectType(type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>2. Qual o tipo de atendimento?</Text>
      
      <View style={styles.cardsContainer}>
        {/* Consultoria Card */}
        <AnimatedPressable 
          entering={FadeInDown.delay(200).duration(400)}
          style={({ pressed }) => [
            styles.card,
            selectedType === 'consultoria' && styles.cardSelected,
            { transform: [{ scale: pressed ? 0.97 : 1 }] }
          ]}
          onPress={() => handleSelect('consultoria')}
        >
          <View style={[styles.iconContainer, selectedType === 'consultoria' ? styles.iconContainerSelected : {}]}>
            <Text style={styles.emoji}>🍼</Text>
          </View>
          <Text style={[styles.cardTitle, selectedType === 'consultoria' && styles.textSelected]}>
            Consultoria Materna
          </Text>
          <Text style={styles.cardDesc}>
            Avaliação e acompanhamento de amamentação.
          </Text>
        </AnimatedPressable>

        {/* Furo Humanizado Card */}
        <AnimatedPressable 
          entering={FadeInDown.delay(300).duration(400)}
          style={({ pressed }) => [
            styles.card,
            selectedType === 'furo' && styles.cardSelected,
            { transform: [{ scale: pressed ? 0.97 : 1 }] }
          ]}
          onPress={() => handleSelect('furo')}
        >
          <View style={[styles.iconContainer, selectedType === 'furo' ? styles.iconContainerSelected : {}]}>
            <Text style={styles.emoji}>💎</Text>
          </View>
          <Text style={[styles.cardTitle, selectedType === 'furo' && styles.textSelected]}>
            Furo Humanizado
          </Text>
          <Text style={styles.cardDesc}>
            Registro do procedimento de perfuração humanizada.
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFDF7', // Creme background when selected
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: '#FFF2F5', // Rosa claro
  },
  emoji: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  textSelected: {
    color: Colors.primary,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  }
});
