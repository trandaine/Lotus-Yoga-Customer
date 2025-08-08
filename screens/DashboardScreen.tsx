import { Image } from 'expo-image';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import db from '../lib/firebase';

type DashboardScreenProps = {
  navigation: any;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  // Remote data state
  type CourseRaw = {
    id?: number;
    name?: string;
    description?: string;
    duration?: number;
    level?: string;
    price?: number;
    imageUrl?: string;
    categoryId?: number;
    teacherId?: number;
    room?: string;
  };

  const { user } = useAuth();

  const [coursesRaw, setCoursesRaw] = useState<CourseRaw[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [userPurchasedCourseIds, setUserPurchasedCourseIds] = useState<Set<number>>(new Set());

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [remoteCategories, setRemoteCategories] = useState<string[]>([]);
  const [categoryIdToName, setCategoryIdToName] = useState<Record<number, string>>({});
  const [teacherIdToName, setTeacherIdToName] = useState<Record<number, string>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

  // Fetch user's purchased courses
  useEffect(() => {
    let isMounted = true;
    const fetchUserPurchases = async () => {
      if (!user) return;
      try {
        const custId = (typeof user.customerId === 'number' ? user.customerId : user.id) ?? -1;
        const xrefSnap = await getDocs(query(collection(db, 'customer_course_cross_ref'), where('customerId', '==', custId)));
        const purchasedIds = new Set<number>();
        xrefSnap.forEach((doc) => {
          const data = doc.data() as { courseId?: number };
          if (typeof data.courseId === 'number') purchasedIds.add(data.courseId);
        });
        if (isMounted) setUserPurchasedCourseIds(purchasedIds);
      } catch (e) {
        // ignore for now
      }
    };
    fetchUserPurchases();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const snap = await getDocs(collection(db, 'categories'));
        const namesSet = new Set<string>();
        const idToName: Record<number, string> = {};
        snap.forEach((doc) => {
          const data = doc.data() as { id?: number; categoryId?: number; name?: string };
          if (data && typeof data.name === 'string' && data.name.trim()) {
            namesSet.add(data.name.trim());
            const catId = typeof data.categoryId === 'number' ? data.categoryId : (typeof data.id === 'number' ? data.id : undefined);
            if (typeof catId === 'number') {
              idToName[catId] = data.name.trim();
            }
          }
        });
        if (isMounted) {
          setRemoteCategories(Array.from(namesSet));
          setCategoryIdToName(idToName);
        }
      } catch (e) {
        // Swallow errors for now; could add UI feedback if needed
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'teachers'));
        const mapping: Record<number, string> = {};
        snap.forEach((doc) => {
          const data = doc.data() as { id?: number; teacherId?: number; name?: string };
          const tId = typeof data.teacherId === 'number' ? data.teacherId : (typeof data.id === 'number' ? data.id : undefined);
          if (typeof tId === 'number' && typeof data.name === 'string') {
            mapping[tId] = data.name;
          }
        });
        if (isMounted) setTeacherIdToName(mapping);
      } catch (e) {
        // ignore for now
      }
    };
    fetchTeachers();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => ['All', ...remoteCategories], [remoteCategories]);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const snap = await getDocs(collection(db, 'courses'));
        const rows: CourseRaw[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as CourseRaw;
          rows.push(data);
        });
        if (isMounted) setCoursesRaw(rows);
      } catch (e) {
        // noop for now
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const marketplaceCourses = useMemo(() => {
    return coursesRaw
      .filter((c) => {
        const id = typeof c.courseId === 'number' ? c.courseId : (typeof c.id === 'number' ? c.id : undefined);
        return typeof id === 'number' && !userPurchasedCourseIds.has(id);
      })
      .map((c, index) => {
        const categoryName = c.categoryId != null ? (categoryIdToName[c.categoryId] ?? 'Other') : 'Other';
        const instructorName = c.teacherId != null ? (teacherIdToName[c.teacherId] ?? 'Unknown') : 'Unknown';
        const title = c.name ?? `Course ${c.id ?? index + 1}`;
        const durationText = typeof c.duration === 'number' ? `${c.duration} min` : '—';
        const priceText = typeof c.price === 'number' ? `$${c.price.toFixed(2)}` : '$0.00';
        return {
          id: c.id ?? index + 1,
          title,
          instructor: instructorName,
          duration: durationText,
          level: c.level ?? 'All Levels',
          price: priceText,
          rating: 5,
          students: 0,
          imageUrl: c.imageUrl ?? '',
          category: categoryName,
          description: c.description ?? '',
          room: c.room ?? '',
          rawCourse: c, // Pass the complete raw course data
        };
      });
  }, [coursesRaw, categoryIdToName, teacherIdToName, userPurchasedCourseIds]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return marketplaceCourses.filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [searchQuery, selectedCategory, marketplaceCourses]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome back, {user?.name || 'User'}! 👋</Text>
          <Text style={styles.headerSubtitle}>Ready for your next yoga session?</Text>
        </View>


        {/* Marketplace Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover New Courses</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses, instructors, categories"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {categories.map((cat) => {
              const selected = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.marketplaceList}>
            {filteredCourses.length === 0 && (
              <Text style={styles.noResultsText}>No courses found</Text>
            )}
            {filteredCourses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.marketplaceCard} activeOpacity={0.8}>
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
                    <Text style={styles.priceBadgeText}>{course.price}</Text>
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
                  <TouchableOpacity 
                    style={styles.buyButton} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Payment', { 
                      course: {
                        ...course,
                        price: course.rawCourse?.price?.toString() || course.price,
                        room: course.rawCourse?.room || course.room,
                        category: course.category,
                      }
                    })}
                  >
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  marketplaceList: {
    gap: 16,
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  chipsContainer: {
    paddingVertical: 4,
    paddingRight: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  chipText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  marketplaceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
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
  noResultsText: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 12,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
}); 