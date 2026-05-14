import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { uploadFileToCloudinary } from "./ImageService";

export const createOrUpdateWallet = async (
    budgetData: Partial<WalletType>
):Promise<ResponseType> =>{
    try{
        let budgetToSave= {...budgetData};

        if (budgetData.image) {
              const imageUploadRes = await uploadFileToCloudinary(
                budgetData.image,
                "budgets"
              );
            
            if (!imageUploadRes.success) {
                return {
                  success: false,
                  msg: imageUploadRes.msg || "Failed to upload budget icon",
                };
              }
        
              budgetToSave.image = imageUploadRes.data;
            }
        
        if(!budgetData?.id){
            //new wallet
            budgetToSave.amount=0;
            budgetToSave.totalIncome=0;
            budgetToSave.totalExpenses=0;
            budgetToSave.created= new Date();
        }

        const budgetRef= 
        budgetData?.id?doc(firestore,"budgets",budgetData.id):
        doc(collection(firestore,"budgets"));

        await setDoc(budgetRef,budgetToSave,{merge:true}) //updates only the data provided
        return{success:true,data:{...budgetToSave,id:budgetRef.id}};
    }catch(error:any)
    {
        console.log('error creating or updating budget',error);
        return {success:false, msg: error.message};
    }
}

export const deleteBudget = async (budgetId: string): Promise<ResponseType> => {
  try {
    const budgetRef = doc(firestore, "budgets", budgetId);

    await deleteDoc(budgetRef);

    deleteTransactionByBudgetId(budgetId);

    return {
      success: true,
      msg: "Wallet deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting wallet:", error);
    return {
      success: false,
      msg: error.message,
    };
  }
};

export const deleteTransactionByBudgetId = async (budgetId: string): Promise<ResponseType> => {
    try {
    let hasMoreTransactions = true;

    while (hasMoreTransactions) {
      const transactionsQuery = query(
        collection(firestore, "transactions"),
        where("walletId","==",budgetId)
      );     
      const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.size === 0) {
        hasMoreTransactions = false; // No more transactions to delete
        break;
      }

      const batch = writeBatch(firestore);

      transactionsSnapshot.forEach((transactionDoc) => {
        batch.delete(transactionDoc.ref);
      });

      await batch.commit();    
      
      console.log(
        `${transactionsSnapshot.size} transactions deleted in this batch`
      );
    }
    return{
      success:true,
      msg :"All transactions have be deleted"
    }

  } catch (error: any) {
    console.error("Error deleting wallet:", error);
    return {
      success: false,
      msg: error.message,
    };
  }
}
