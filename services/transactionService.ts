import { firestore } from "@/config/firebase";
import { colors } from "@/constants/theme";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { uploadFileToCloudinary } from "./ImageService";
import { createOrUpdateWallet } from "./budgetService";

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
):Promise<ResponseType> => {
    try {
    const { id, type, amount, walletId, image } = transactionData;
    if (!amount || amount <= 0 || !walletId || !type) {
      return {success: false,msg: "Invalid transaction data!",};
    }
    if(id){
        const oldTransactionSnapshot = await getDoc(
        doc(firestore, "transactions", id)
      );
      const oldTransaction = oldTransactionSnapshot.data() as TransactionType;

      const shouldRevertOriginal =
        oldTransaction.type != type ||
        oldTransaction.amount != amount ||
        oldTransaction.walletId != walletId;

     if (shouldRevertOriginal) {
        // Check if we need to revert the original transaction (type, amount, or wallet changed)
        let res = await revertAndUpdateWallets(
          oldTransaction, // Old transaction
          Number(amount!), // New transaction amount
          type, // New transaction type ('income' or 'expense')
          walletId! // New wallet ID
        );

        if (!res.success) return res;
      }
    }else{
      //update wallet for new transaction
      let res = await updateBudgetForNewTransaction(
        walletId,
        Number(amount!),
        type
      )
      if(!res.success) return res;
    }

        if (image) {
          const imageUploadRes = await uploadFileToCloudinary(
            image,
            "transactions"
          );
        
        if (!imageUploadRes.success) {
            return {
              success: false,
              msg: imageUploadRes.msg || "Failed to upload receipt",
            };
          }
    
          transactionData.image = imageUploadRes.data;
        }

  const transactionRef  =  id
    ? doc(firestore,"transactions",id)
    :doc(collection(firestore,"transactions"));

    await setDoc(transactionRef,transactionData,{merge:true});

    return {success:true, data:{...transactionData,id:transactionRef.id}};
  } catch (err:any){
    console.log("error creating or updating transaction:",err);
    return{success:false,msg:err.msg}
  }
};

export const updateBudgetForNewTransaction = async (
  budgetId: string,
  amount: number,
  type: string
) => {
      try{
    
    const budgetRef = doc(firestore,"budgets",budgetId);
    const budgetSnapshot = await getDoc(budgetRef);
    if(!budgetSnapshot.exists()){
     console.log("error updating budget for new transaction:");
    return{success:false,msg:"Budget not found"}
    }

    const budgetData = budgetSnapshot.data() as WalletType;

    if(type=="expense"&& budgetData.amount! - amount<0){
      return{success:false,msg:"The selected budget doesn't have enough balance"}
    }

    const updateType = type =='income'? "totalIncome":"totalExpenses";
    const updatedBudgetAmount = type == "income"
    ?Number(budgetData.amount) + amount 
    :Number(budgetData.amount) - amount;


    const updatedTotals = type == "income"
    ?Number(budgetData.totalIncome) + amount 
    :Number(budgetData.totalExpenses) + amount;

    await updateDoc(budgetRef,{
      amount:updatedBudgetAmount,
      [updateType]:updatedTotals
    })
    return {success:true};
    } catch (err:any){
    console.log("error updating budget for new transaction:",err);
    return{success:false,msg:err.msg}
    }

  }

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newBudgetId: string
) => {
  try {
    // Fetch the original wallet data before updating the amounts
    const originalBudgetSnapshot = await getDoc(
      doc(firestore, "budgets", oldTransaction.walletId)
    );
    const originalBudget = originalBudgetSnapshot.data() as WalletType;

    let newBudgetSnapshot = await getDoc(
      doc(firestore, "budgets", newBudgetId)
    );
    let newBudget = newBudgetSnapshot.data() as WalletType;

     const revertType =
      oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";

    const revertIncomeExpense: number =
      oldTransaction.type == "income"
        ? -Number(oldTransaction.amount!) // Subtract income from wallet balance
        : Number(oldTransaction.amount!); // Add back expense to wallet balance

    const revertedBudgetAmount =
      Number(originalBudget.amount!) + Number(revertIncomeExpense);

    const revertedIncomeExpenseAmount =
      Number(originalBudget[revertType]!) - Number(oldTransaction.amount!);

    // check if the user is trying to conver the income to expense on the same wallet

    if (newTransactionType == "expense") {
      if (
        oldTransaction.walletId == newBudgetId &&
        revertedBudgetAmount < newTransactionAmount
      ) {
        console.log(
          "same wallet, the budget balance after transaction: ",
          revertedBudgetAmount - newTransactionAmount
        );
        return {
          success: false,
          msg: "The selected budget don't have enough balance!",
        };
      }  
 
      // if user tries to add expense from a new wallet but the new wallet don't have enough balance
       
      if (newBudget.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "The selected budget don't have enough balance!",
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedBudgetAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });

    ////////////////////////////////////////////////////////////////////////////

    // the new wallet could be the same wallet and we will need the updated wallet amounts
    // so we will need to refetch the wallet
    newBudgetSnapshot = await getDoc(doc(firestore, "budgets", newBudgetId));
    newBudget = newBudgetSnapshot.data() as WalletType;

    const updateType =
      newTransactionType == "income" ? "totalIncome" : "totalExpenses";

    const updateTransactionAmount: number =
      newTransactionType == "income"
        ? Number(newTransactionAmount) // Add income to wallet balance
        : -Number(newTransactionAmount); // Subtract expense from wallet balance

    const newBudgetAmount = Number(newBudget.amount!) + updateTransactionAmount;

    const newIncomeExpenseAmount =
      (Number(newBudget[updateType]!) + Number(newTransactionAmount))
      ;

    await createOrUpdateWallet({
      id: newBudgetId,
      amount: newBudgetAmount,
      [updateType]: newIncomeExpenseAmount,
    });
    return {success:true};
    } catch (err:any){
    console.log("error updating budget for new transaction:",err);
    return{success:false,msg:err.msg}
    }
}

export const deleteTransaction = async (
  transactionId: string,
  BudgetId: string
) => {
  try{
    const transactionRef = doc(firestore, "transactions", transactionId);
    const transactionSnapshot = await getDoc(transactionRef);

    if (!transactionSnapshot.exists()) {
      return { success: false, msg: "Transaction not found" };
    }
    const transactionData = transactionSnapshot.data() as TransactionType;
    const transactionType = transactionData?.type;
    const transactionAmount = Number(transactionData?.amount);

    const budgetSnapshot = await getDoc(doc(firestore, "budgets", BudgetId));
    const budgetData = budgetSnapshot.data() as WalletType;

    // Determine the field to update based on transaction type
    const updateType =
      transactionType === "income" ? "totalIncome" : "totalExpenses";
    const newBudgetAmount =
      budgetData?.amount! -
      (transactionType === "income" ? transactionAmount : -transactionAmount);

    const newIncomeExpenseAmount = budgetData[updateType]! - transactionAmount;

    // if its income and the wallet amount can go below zero
    if (transactionType == "income" && newBudgetAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction" };
    }

    await createOrUpdateWallet({
      id: BudgetId,
      amount: newBudgetAmount,
      [updateType]: newIncomeExpenseAmount,
    });
    
    await deleteDoc(transactionRef);

     return {success:true};
    } catch (err:any){
    console.log("error updating budget for new transaction:",err);
    return{success:false,msg:err.msg}
    }
  }

  export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try{
    const db = firestore;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );    

    const querySnapshot = await getDocs(transactionsQuery);
    const weeklyData = getLast7Days();
    const transactions: TransactionType[] = [];

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Include document ID in the transaction data
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toISOString()
        .split("T")[0]; // as specific date
      const dayData = weeklyData.find((day) => day.date === transactionDate);

      if (dayData) {
        if (transaction.type === "income") dayData.income += transaction.amount;
        else if (transaction.type === "expense")
          dayData.expense += transaction.amount;
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary,
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions, // Include all transaction details
      },
    };
    } catch (err:any){
    console.log("error fetching weekly stats:",err);
    return{success:false,msg:err.msg}
    }
  }

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    // Define query to fetch transactions in the last 12 months
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];

    // Process transactions to calculate income and expense for each month
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Include document ID in transaction data
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp).toDate();
      const monthName = transactionDate.toLocaleString("default", {
        month: "short",
      });
      const shortYear = transactionDate.getFullYear().toString().slice(-2);
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      );

      if (monthData) {
        if (transaction.type === "income") {
          monthData.income += transaction.amount;
        } else if (transaction.type === "expense") {
          monthData.expense += transaction.amount;
        }
      }
    });

    // Reformat monthlyData for the bar chart with income and expense entries for each month
    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(46),
        frontColor: colors.primary, // Income bar color
      },
      {
        value: month.expense,
        frontColor: colors.rose, // Expense bar color
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions, // Include all transaction details
      },
    };
  } catch (error) {
    console.error("Error fetching monthly transactions:", error);
    return {
      success: false,
      msg: "Failed to fetch monthly transactions",
    };
  }
};

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;

    // Fetch all transactions for the specified user
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: TransactionType[] = [];

    // Find the first and last year from transactions
    const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = doc.data().date.toDate();
      return transactionDate < earliest ? transactionDate : earliest;
    }, new Date());

    const firstYear = firstTransaction.getFullYear();
    const currentYear = new Date().getFullYear();

    // Initialize yearly data range
    const yearlyData = getYearsRange(firstYear, currentYear);

    // Process transactions to calculate income and expense for each year
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Include document ID in transaction data
      transactions.push(transaction);

      const transactionYear = (transaction.date as Timestamp)
        .toDate()
        .getFullYear();
      const yearData = yearlyData.find(
        (item: any) => item.year === transactionYear.toString()
      );

      if (yearData) {
        if (transaction.type === "income") {
          yearData.income += transaction.amount;
        } else if (transaction.type === "expense") {
          yearData.expense += transaction.amount;
        }
      }
    });

    // Reformat yearlyData for the bar chart with income and expense entries for each year
    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: colors.primary, // Income bar color
      },
      {
        value: year.expense,
        frontColor: colors.rose, // Expense bar color
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions, // Include all transaction details
      },
    };
  } catch (error) {
    console.error("Error fetching yearly transactions:", error);
    return {
      success: false,
      msg: "Failed to fetch yearly transactions",
    };
  }
};

export const fetchRecentExpenseTransactions = async (
  uid: string,
  days: number = 14
): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("uid", "==", uid),
      where("type", "==", "expense"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: TransactionType[] = [];

    querySnapshot.forEach((docItem) => {
      const transaction = docItem.data() as TransactionType;
      transaction.id = docItem.id;
      transactions.push(transaction);
    });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.log("error fetching recent expense transactions:", error);
    return {
      success: false,
      msg: error?.msg || "Failed to fetch recent expense transactions",
    };
  }
};