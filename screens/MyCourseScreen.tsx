import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import db from '../lib/firebase';

type MainTabParamList = {
  Dashboard: undefined;
  Course: undefined;
  User: undefined;
  Bills: undefined;
};

type MyCourseScreenProps = BottomTabScreenProps<MainTabParamList, 'Course'>;

export default function MyCourseScreen({ navigation }: MyCourseScreenProps) {
  const { user } = useAuth();

  type CourseRaw = {
    id?: number;
    courseId?: number;
    name?: string;
    description?: string;
    duration?: number;
    level?: string;
    imageUrl?: string;
    teacherId?: number;
  };

  type PurchasedCourse = {
    id: number;
    title: string;
    instructor: string;
    duration: string;
    level: string;
    description: string;
    imageUrl?: string;
    progress: number; // placeholder
    lastAccessed?: string; // placeholder
  };

  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchMyCourses = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const custId = (typeof user.customerId === 'number' ? user.customerId : user.id) ?? -1;
        const xrefSnap = await getDocs(query(collection(db, 'customer_course_cross_ref'), where('customerId', '==', custId)));
        const courseIds = new Set<number>();
        xrefSnap.forEach((doc) => {
          const data = doc.data() as { courseId?: number };
          if (typeof data.courseId === 'number') courseIds.add(data.courseId);
        });

        const coursesSnap = await getDocs(collection(db, 'courses'));
        const teachersSnap = await getDocs(collection(db, 'teachers'));
        const teacherMap: Record<number, string> = {};
        teachersSnap.forEach((doc) => {
          const d = doc.data() as { id?: number; teacherId?: number; name?: string };
          const tid = typeof d.teacherId === 'number' ? d.teacherId : (typeof d.id === 'number' ? d.id : undefined);
          if (typeof tid === 'number' && typeof d.name === 'string') teacherMap[tid] = d.name;
        });

        const rows: PurchasedCourse[] = [];
        coursesSnap.forEach((doc) => {
          const c = doc.data() as CourseRaw;
          const id = typeof c.courseId === 'number' ? c.courseId : (typeof c.id === 'number' ? c.id : undefined);
          if (typeof id === 'number' && courseIds.has(id)) {
            rows.push({
              id,
              title: c.name ?? `Course ${id}`,
              instructor: c.teacherId != null ? (teacherMap[c.teacherId] ?? 'Unknown') : 'Unknown',
              duration: typeof c.duration === 'number' ? `${c.duration} min` : '—',
              level: c.level ?? 'All Levels',
              description: c.description ?? '',
              imageUrl: c.imageUrl,
              progress: 0,
              lastAccessed: undefined,
            });
          }
        });
        if (isMounted) setPurchasedCourses(rows);
      } catch (e) {
        // ignore for now
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMyCourses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'all levels':
        return '#6B7280'; // Gray
      case 'beginner':
        return '#10B981'; // Green
      case 'intermediate':
        return '#8B5CF6'; // Purple (was Amber)
      case 'advanced':
        return '#EF4444'; // Red
      case 'vip':
        return '#F59E0B'; // Amber (was Purple)
      default:
        return '#4CAF50'; // Default green
    }
  };

  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return purchasedCourses;
    }
    return purchasedCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query) ||
        course.level.toLowerCase().includes(query)
    );
  }, [purchasedCourses, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Courses</Text>
          <Text style={styles.headerSubtitle}>Continue your yoga journey</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.section}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your courses..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Course List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchased Courses ({filteredCourses.length})</Text>
          {filteredCourses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard} activeOpacity={0.7}>
              <View style={styles.courseImageWrapper}>
                {course.imageUrl ? (
                  <Image source={{ uri: course.imageUrl }} style={styles.courseImage} contentFit="cover" />
                ) : (
                  <View style={styles.courseImageFallback} />
                )}
                <View style={[styles.categoryBadge, { backgroundColor: getLevelColor(course.level) }]}>
                  <Text style={styles.categoryText}>{course.level}</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{course.duration}</Text>
                </View>
              </View>
              <View style={styles.courseContent}>
                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                {!!course.instructor && course.instructor !== 'Unknown' && (
                  <Text style={styles.courseInstructor}>by {course.instructor}</Text>
                )}
                <View style={styles.chipRow}>
                  {!!course.duration && <Text style={styles.metaChip}>{course.duration}</Text>}
                  {!!course.level && <Text style={styles.metaChip}>{course.level}</Text>}
                </View>
                <Text style={styles.courseDescription} numberOfLines={3}>
                  {course.description}
                </Text>
                <TouchableOpacity style={styles.continueButton}>
                  <Text style={styles.continueButtonText}>
                    {course.progress === 100 ? 'Review' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.courseFooter}>
                <Text style={styles.lastAccessed}>{course.lastAccessed ? `Last accessed: ${course.lastAccessed}` : ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State (if no courses) */}
         {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={styles.emptyStateTitle}>No Courses Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Purchase your first course to start your yoga journey
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseImageWrapper: {
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F8FF',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseImageFallback: {
    flex: 1,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  courseContent: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#4E5A65',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    backgroundColor: '#F1F5F9',
    color: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  courseDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastAccessed: {
    fontSize: 12,
    color: '#999',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBarContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 