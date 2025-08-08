import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import db from '../lib/firebase';

export default function BillScreen() {
  const { user } = useAuth();

  type UserTransaction = {
    transactionId?: number;
    customerId?: number;
    courseId?: number;
    amount?: number;
    paymentMethod?: string;
    status?: string;
    transactionDate?: string; // stored as YYYY-MM-DD
  };

  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [courseIdToName, setCourseIdToName] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  // Fetch current user balance from database
  useEffect(() => {
    let isMounted = true;
    const fetchUserBalance = async () => {
      if (!user) return;
      
      try {
        const customerId = user?.customerId || user?.id;
        const customerQuery = query(collection(db, 'customers'), where('customerId', '==', customerId));
        const customerSnapshot = await getDocs(customerQuery);
        
        if (!customerSnapshot.empty && isMounted) {
          const customerData = customerSnapshot.docs[0].data();
          setCurrentBalance(customerData.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
        if (isMounted) {
          setCurrentBalance(user?.balance || 0);
        }
      }
    };

    fetchUserBalance();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const fetchTxns = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const custId = (typeof user.customerId === 'number' ? user.customerId : user.id) ?? -1;
        const q = query(collection(db, 'user_transactions'), where('customerId', '==', custId));
        const snap = await getDocs(q);
        const rows: UserTransaction[] = [];
        snap.forEach((doc) => rows.push(doc.data() as UserTransaction));
        // sort by date desc if present
        rows.sort((a, b) => (b.transactionDate ?? '').localeCompare(a.transactionDate ?? ''));
        if (isMounted) setTransactions(rows);
      } catch (e) {
        // ignore for now
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTxns();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const map: Record<number, string> = {};
        snap.forEach((doc) => {
          const data = doc.data() as { id?: number; courseId?: number; name?: string };
          const id = typeof data.courseId === 'number' ? data.courseId : (typeof data.id === 'number' ? data.id : undefined);
          if (typeof id === 'number' && typeof data.name === 'string') {
            map[id] = data.name;
          }
        });
        if (isMounted) setCourseIdToName(map);
      } catch (e) {
        // ignore
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
  }, [transactions]);

  const showTransactionDetails = (transaction: any) => {
    Alert.alert(
      `Transaction Details - ${transaction.courseTitle}`,
      `Transaction ID: ${transaction.id}\n` +
      `Date: ${transaction.date}\n` +
      `Amount: ${transaction.amount}\n` +
      `Payment Method: ${transaction.paymentMethod}\n` +
      `Status: ${transaction.status}\n` +
      `Category: ${transaction.category}`,
      [
        {
          text: 'Download Receipt',
          onPress: () => Alert.alert('Receipt', 'Receipt download functionality would be implemented here'),
        },
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#4CAF50';
      case 'Pending':
        return '#FF9800';
      case 'Failed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getTxnIcon = () => '🧾';

  const handleTopUpBalance = async () => {
    const amount = parseFloat(topUpAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setIsTopUpLoading(true);
      
      // Find the user document
      const customerId = user?.customerId || user?.id;
      const customerQuery = query(collection(db, 'customers'), where('customerId', '==', customerId));
      const customerSnapshot = await getDocs(customerQuery);
      
      if (customerSnapshot.empty) {
        Alert.alert('Error', 'User not found in database');
        return;
      }

      const customerDoc = customerSnapshot.docs[0];
      const newBalance = (customerDoc.data().balance || 0) + amount;
      
      // Update the balance in Firestore
      await updateDoc(doc(db, 'customers', customerDoc.id), {
        balance: newBalance
      });

      // Update local state
      setCurrentBalance(newBalance);
      setTopUpAmount('');
      
      Alert.alert(
        'Success!',
        `Balance topped up successfully! New balance: $${newBalance.toFixed(2)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error topping up balance:', error);
      Alert.alert('Error', 'Failed to top up balance. Please try again.');
    } finally {
      setIsTopUpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bills & Transactions</Text>
          <Text style={styles.headerSubtitle}>Your purchase history</Text>
        </View>

        {/* Top Up Balance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Up Balance</Text>
          <View style={styles.topUpCard}>
            <View style={styles.topUpRow}>
              <View style={styles.topUpInputContainer}>
                <Text style={styles.topUpLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.topUpInput}
                  placeholder="Enter amount to add"
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity
                style={[styles.topUpButton, isTopUpLoading && styles.topUpButtonDisabled]}
                onPress={handleTopUpBalance}
                disabled={isTopUpLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.topUpButtonText}>
                  {isTopUpLoading ? 'Processing...' : 'Add Money'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={[styles.statTile, styles.statTileAmber]}>
              <View style={styles.statRow}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconPill, styles.iconPillAmber]}>
                    <Ionicons name="wallet-outline" size={18} color="#8D6E00" />
                  </View>
                  <Text style={styles.statLabel}>Current Balance</Text>
                </View>
                <Text style={[styles.statValue, styles.valueAmber]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>${currentBalance.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileBlue]}>
              <View style={styles.statRow}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconPill, styles.iconPillBlue]}>
                    <Ionicons name="swap-horizontal-outline" size={18} color="#1565C0" />
                  </View>
                  <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <Text style={[styles.statValue, styles.valueBlue]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{transactions.length}</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileGreen]}>
              <View style={styles.statRow}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconPill, styles.iconPillGreen]}>
                    <Ionicons name="card-outline" size={18} color="#2E7D32" />
                  </View>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                <Text style={[styles.statValue, styles.valueGreen]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>${totalSpent.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaction List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.noTransactionsText}>No transactions found.</Text>
          ) : (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.transactionId || Math.random().toString()}
                style={styles.transactionCard}
                onPress={() => showTransactionDetails(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="receipt-outline" size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{transaction.courseTitle}</Text>
                    <Text style={styles.transactionDate}>{transaction.transactionDate}</Text>
                    <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.amountText}>${transaction.amount?.toFixed(2)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionIdText}>Txn ID: {transaction.transactionId}</Text>
                  <TouchableOpacity style={styles.receiptButton}>
                    <Ionicons name="download-outline" size={16} color="#4CAF50" />
                    <Text style={styles.receiptText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  statTile: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  iconPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
  },
  iconPillGreen: { backgroundColor: '#E6F4EA' },
  iconPillBlue: { backgroundColor: '#E3F2FD' },
  iconPillAmber: { backgroundColor: '#FFF3E0' },
  statTileGreen: { borderColor: '#E6F4EA', borderWidth: 1 },
  statTileBlue: { borderColor: '#E3F2FD', borderWidth: 1 },
  statTileAmber: { borderColor: '#FFF3E0', borderWidth: 1 },
  valueGreen: { color: '#2E7D32' },
  valueBlue: { color: '#1565C0' },
  valueAmber: { color: '#8D6E00' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  transactionInstructor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
  },
  receiptText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  downloadAllButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  noTransactionsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  transactionIdText: {
    fontSize: 12,
    color: '#666',
  },
  topUpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topUpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  topUpInputContainer: {
    flex: 1,
  },
  topUpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  topUpInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
  },
  topUpButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  topUpButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  topUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 