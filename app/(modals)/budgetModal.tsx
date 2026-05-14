
import BackButton from "@/components/BackButton"
import Button from "@/components/Button"
import Header from "@/components/Header"
import ImageUpload from "@/components/ImageUpload"
import Input from "@/components/Input"
import ModalWrapper from '@/components/ModalWrapper'
import Typo from "@/components/Typo"
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from "@/contexts/authContext"
import { createOrUpdateWallet, deleteBudget } from "@/services/budgetService"
import { WalletType } from "@/types"
import { scale, verticalScale } from '@/utils/styling'
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Icons from 'phosphor-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'


const WalletModel = () => {

    const{user,updateUserData}= useAuth();
  const [budget,setBudget]=useState<WalletType>({
    name:"",
    image:null,
  })

  const [loading,setLoading]=useState(false);
  const router = useRouter();
  const oldBudget: { name: string; image: string; id?: string } =
   useLocalSearchParams();
  // console.log("params: ", oldBudget);

    useEffect(() => {
    if (oldBudget?.id) {
      setBudget({
        name: oldBudget.name,
        image: oldBudget?.image || null,
      });
    }
  }, []);
   
    const onSubmit = async () => {
    let { name, image } = budget;
    if (!name.trim() || !image){
      Alert.alert("Budget", "Please fill all the fields!");
      return;
    }

    const data: WalletType ={
        name,
        image,
        uid: user?.uid
    };

    if(oldBudget?.id)  data.id = oldBudget?.id;
    setLoading(true);
    const res =await createOrUpdateWallet(data);
    setLoading(false);
    //console.log('result',res);
    if(res.success){
      router.back();
    }else{
      Alert.alert("Budget",res.msg);
    }
  }

  const onDelete = async () => {
    if (!oldBudget?.id) return;
    setLoading(true);
    const res = await deleteBudget(oldBudget.id as string);
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Wallet", res.msg);
    }
  }
  const showDeleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to do this?\nThis will remove all the transactions related to this budget!",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel delete"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => onDelete(),
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldBudget?.id ? "Updated Budget" : "New Budget"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/*form*/}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Budget Name</Typo>
            <Input
              placeholder="budget"
              value={budget.name}
              onChangeText={(value) => setBudget({ ...budget, name: value })}
            />
          </View>
            <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Budget Icon</Typo>
            <ImageUpload file={budget.image}
            onClear={()=> setBudget({...budget,image:null})}
             onSelect={file=> setBudget({...budget,image:file})}placeholder="Upload Image"/>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {
          oldBudget?.id && !loading &&(
            <Button
              style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
            onPress={showDeleteAlert}
            >
              <Icons.TrashIcon
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
              />

            </Button>
          )
        }
        <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
          <Typo color={colors.black} fontWeight={"700"} size={18}>
            {oldBudget?.id ? "Update Budget" : "Add Budget"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default WalletModel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
    // paddingVertical: spacingY._30,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
    // overflow: "hidden",
    // position: "relative",
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
