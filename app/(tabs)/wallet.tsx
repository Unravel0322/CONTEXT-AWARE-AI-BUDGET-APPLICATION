import BudgetListItem from '@/components/BudgetListItem'
import Loading from '@/components/Loading'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import { WalletType } from '@/types'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import { orderBy, where } from 'firebase/firestore'
import * as Icons from 'phosphor-react-native'
import React from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'

const Wallet = () => {
const { user } = useAuth();
  const router = useRouter();
    const {
    data: budget,
    loading,
    error,
  } = useFetchData<WalletType>("budgets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);
   

  const getTotalBalance = () =>
    budget.reduce((total, item) => {
      total = total + (item?.amount || 0);
      return total;
    }, 0);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>
         {/*balance view*/}
         <View style={styles.balanceView}>
          <View style={{ alignItems: "center" }}>
            <Typo size={45} fontWeight={"500"}>
              ${getTotalBalance()?.toFixed(2)}
              </Typo>
              <Typo size={16} color={colors.neutral300}> 
                Total Balance
              </Typo>
          </View>
          </View>

        {/* wallets */}
        <View style={styles.wallets}>
          {/* header */}
          <View style={styles.flexRow}>
            <Typo size={20} fontWeight={"500"}>
              My Budgets
            </Typo>
            <TouchableOpacity onPress={() => router.push("/(modals)/budgetModal")}
              >
              <Icons.PlusCircleIcon
                weight="fill"
                color={colors.primary}
                size={verticalScale(33)}
              />
            </TouchableOpacity>
          </View>
          {/*wallet lists*/}
          {loading && <Loading />}
          <FlatList
            data={budget}
            renderItem={({ item, index }) => (
              <BudgetListItem item={item} router={router} index={index} />
            )}
            contentContainerStyle={styles.listStyle}
            // keyExtractor={(item) => item.id}
          />
        </View>
        </View>
    </ScreenWrapper>
  )
}

export default Wallet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  wallets: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopRightRadius: radius._30,

    borderTopLeftRadius: radius._30,
    padding: spacingX._20,
    paddingTop: spacingX._25,
  },
  listStyle: {
    paddingVertical: spacingY._25,
    paddingTop: spacingY._15,
  },
});