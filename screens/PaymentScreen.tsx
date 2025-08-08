import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import db from '../lib/firebase';

type PaymentScreenProps = {
  route: {
    params: {
      course: {
        id: number;
        title: string;
        instructor: string;
        duration: string;
        level: string;
        price: string;
        description: string;
        imageUrl?: string;
        room?: string;
        category?: string;
      };
    };
  };
  navigation: any;
};

export default function PaymentScreen({ route, navigation }: PaymentScreenProps) {
  const { user } = useAuth();
  const { course } = route.params;
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  const paymentMethods = [
    { id: 'credit', name: 'Credit Card', icon: 'card-outline' },
    { id: 'debit', name: 'Debit Card', icon: 'card-outline' },
    { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
    { id: 'apple', name: 'Apple Pay', icon: 'logo-apple' },
    { id: 'google', name: 'Google Pay', icon: 'logo-google' },
  ];

  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);

  // Fetch current user balance from database
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return;
      
      try {
        const customerId = user?.customerId || user?.id;
        const customerQuery = query(collection(db, 'customers'), where('customerId', '==', customerId));
        const customerSnapshot = await getDocs(customerQuery);
        
        if (!customerSnapshot.empty) {
          const customerData = customerSnapshot.docs[0].data();
          setCurrentBalance(customerData.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
        setCurrentBalance(user?.balance || 0);
      }
    };

    fetchUserBalance();
  }, [user]);

  const handlePayment = async () => {
    try {
      // Show processing alert
      Alert.alert(
        'Payment Processing',
        `Processing payment for ${course.title}...`,
        [{ text: 'OK' }]
      );

      // Get customer ID
      const customerId = user?.customerId || user?.id;
      if (!customerId) {
        Alert.alert('Error', 'User information not found');
        return;
      }

      // Create relationship in customer_course_cross_ref collection with customerId_courseId format
      const crossRefData = {
        courseId: course.id,
        customerId: customerId,
      };

      const crossRefDocId = `${customerId}_${course.id}`;
      await setDoc(doc(db, 'customer_course_cross_ref', crossRefDocId), crossRefData);

      // Get the next document ID for user_transactions
      const transactionQuery = query(collection(db, 'user_transactions'));
      const transactionSnapshot = await getDocs(transactionQuery);
      const nextTransactionId = transactionSnapshot.size + 1;

      // Create transaction record in user_transactions collection with integer ID
      const transactionData = {
        customerId: customerId,
        courseId: course.id,
        amount: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
        paymentMethod: selectedMethod?.name || 'Credit Card',
        status: 'Completed',
        transactionDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        transactionId: nextTransactionId, // Use integer ID
      };

      await setDoc(doc(db, 'user_transactions', nextTransactionId.toString()), transactionData);

      // Update user balance in customers collection
      const customerQuery = query(collection(db, 'customers'), where('customerId', '==', customerId));
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerDoc = customerSnapshot.docs[0];
        const newBalance = currentBalance - (typeof course.price === 'string' ? parseFloat(course.price) : course.price);
        
        await updateDoc(customerDoc.ref, {
          balance: newBalance,
        });
        
        // Update local state
        setCurrentBalance(newBalance);
      }

      // Show success message
      Alert.alert(
        'Payment Successful!',
        'Course purchased successfully. You can now access it in your courses.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Course' }),
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        'An error occurred during payment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Course Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Details</Text>
          <View style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseInstructor}>by {course.instructor}</Text>
            </View>
            
            <View style={styles.courseDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{course.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Level:</Text>
                <Text style={styles.detailValue}>{course.level}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{course.category || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room:</Text>
                <Text style={styles.detailValue}>{course.room || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>${typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : course.price}</Text>
              </View>
            </View>
            
            <View style={styles.courseDescription}>
              <Text style={styles.descriptionTitle}>Course Description</Text>
              <Text style={styles.descriptionText}>{course.description}</Text>
            </View>
          </View>
        </View>

        {/* User Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Balance</Text>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Current Balance:</Text>
              <Text style={styles.balanceAmount}>${currentBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Course Price:</Text>
              <Text style={styles.coursePrice}>${typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : course.price}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Remaining Balance:</Text>
              <Text style={styles.remainingBalance}>
                ${(currentBalance - (typeof course.price === 'string' ? parseFloat(course.price) : course.price)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods Dropdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <Ionicons 
                  name={selectedMethod?.icon as any} 
                  size={24} 
                  color="#4CAF50" 
                />
                <Text style={styles.dropdownButtonText}>
                  {selectedMethod?.name}
                </Text>
              </View>
              <Ionicons 
                name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.dropdownItem,
                      selectedPaymentMethod === method.id && styles.selectedDropdownItem
                    ]}
                    onPress={() => {
                      setSelectedPaymentMethod(method.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons 
                      name={method.icon as any} 
                      size={20} 
                      color={selectedPaymentMethod === method.id ? '#4CAF50' : '#666'} 
                    />
                    <Text style={[
                      styles.dropdownItemText,
                      selectedPaymentMethod === method.id && styles.selectedDropdownItemText
                    ]}>
                      {method.name}
                    </Text>
                    {selectedPaymentMethod === method.id && (
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Pay Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <Text style={styles.payButtonText}>Pay ${typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : course.price}</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
  },
  courseDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  courseDescription: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  remainingBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedDropdownItem: {
    backgroundColor: '#F0F9F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
