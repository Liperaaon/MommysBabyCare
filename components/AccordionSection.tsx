import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function AccordionSection({ title, children, defaultExpanded = false }: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.header, expanded && styles.headerExpanded]} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={22} 
          color={Colors.primary} 
        />
      </Pressable>
      
      {expanded && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    flex: 1,
  },
  content: {
    padding: 16,
    backgroundColor: '#fff',
  }
});
