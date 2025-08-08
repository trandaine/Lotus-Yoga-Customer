import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import db from '../lib/firebase';

type Teacher = {
  id?: number;
  teacherId?: number;
  name?: string;
  bio?: string;
  imageUrl?: string;
};

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, 'teachers'));
        const rows: Teacher[] = [];
        snap.forEach((doc) => rows.push(doc.data() as Teacher));
        setTeachers(rows);
      } catch {
        // ignore for now
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      (t.name ?? '').toLowerCase().includes(q) || (t.bio ?? '').toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Our Teachers</Text>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or bio"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {isLoading && (
          <View style={styles.skeletonCard} />
        )}

        {filtered.map((t, idx) => (
          <View key={(t.teacherId ?? t.id ?? idx).toString()} style={styles.card}>
            <View style={styles.imageContainer}>
              {t.imageUrl ? (
                <Image source={{ uri: t.imageUrl }} style={styles.teacherImage} contentFit="cover" />
              ) : (
                <View style={styles.teacherImagePlaceholder}>
                  <Text style={styles.placeholderText}>🧘‍♀️</Text>
                </View>
              )}
            </View>
            <View style={styles.info}> 
              <Text style={styles.name}>{t.name ?? 'Unknown'}</Text>
              {t.bio ? <Text style={styles.bio} numberOfLines={3}>{t.bio}</Text> : null}
              <View style={styles.tagRow}>
                <Text style={[styles.tag, styles.tagPrimary]}>Yoga Instructor</Text>
              </View>
            </View>
          </View>
        ))}

        {!isLoading && filtered.length === 0 && (
          <Text style={styles.emptyText}>No teachers found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 12 },
  searchBarContainer: { marginBottom: 12 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  teacherImage: {
    width: '100%',
    height: '100%',
  },
  teacherImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  placeholderText: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  bio: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F4F6', color: '#374151' },
  tagPrimary: { backgroundColor: '#E6F4EA', color: '#1B5E20', fontWeight: '700' },
  skeletonCard: {
    height: 88,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 12,
  },
  emptyText: { color: '#6B7280', fontSize: 14, paddingTop: 12 },
});


