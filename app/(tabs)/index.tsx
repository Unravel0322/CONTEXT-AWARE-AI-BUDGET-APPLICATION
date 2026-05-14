import Button from '@/components/Button'
import HomeCard from '@/components/HomeCard'
import ScreenWrapper from '@/components/ScreenWrapper'
import TransactionList from '@/components/TransactionList'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import { setupContextAwareNotifications } from '@/services/contextAwareNotificationService'
import { fetchRecentExpenseTransactions } from '@/services/transactionService'
import { TransactionType } from '@/types'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import { limit, orderBy, where } from 'firebase/firestore'
import * as Icons from 'phosphor-react-native'
import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();

  const constraints = [
    where("uid", "==", user?.uid),
    orderBy("date", "desc"),
    limit(30),
  ];

  const {
    data: recentTransactions,
    loading: transactionsLoading,
    error,
  } = useFetchData<TransactionType>("transactions", constraints);

  useEffect(() => {
    const runContextAwareNotifications = async () => {
      if (!user?.uid) return;

      const res = await fetchRecentExpenseTransactions(user.uid, 14);

      if (res.success) {
        const expenses = res.data || [];
        const result = await setupContextAwareNotifications(expenses);
        console.log("Notification setup result:", result);
      } else {
        console.log("Failed to fetch recent expenses:", res.msg);
      }
    };

    runContextAwareNotifications();
  }, [user?.uid]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>
              Hello,
            </Typo>
            <Typo fontWeight={"500"} size={20}>
              {user?.name || " "}
            </Typo>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(modals)/searchModal")}
            style={styles.searchIcon}
          >
            <Icons.MagnifyingGlassIcon
              size={verticalScale(22)}
              color={colors.neutral200}
              weight="bold"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          {/* card */}
          <View>
            <HomeCard />
          </View>

          <TransactionList
            data={recentTransactions}
            loading={transactionsLoading}
            emptyListMessage='No Transactions added yet!'
            title="Recent Transaction"
          />
        </ScrollView>

        <Button
          onPress={() => router.push("/(modals)/transactionModal")}
          style={styles.floatingButton}
        >
          <Icons.PlusIcon
            color={colors.black}
            weight="bold"
            size={verticalScale(24)}
          />
        </Button>
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25,
  },
});