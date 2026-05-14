import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { Router, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router: Router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('firebase user',firebaseUser)
   if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser?.displayName,
        });
        updateUserData(firebaseUser.uid);
        router.replace("/(tabs)" as any);
       } else {
        setUser(null);
        router.replace("/(auth)/welcome");
       }
    });
    return () => unsubscribe();
  },[]);
  
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("error message:", msg)
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong credentials";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("error message:", msg)
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "This email is already in use";
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: data.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
        };
        setUser({...userData });
      }
    } catch (error:any) {
      let msg = error.message;
      console.error("Error fetching user data: ", error);
    }
  };

  const resetPassword = async (email: string) => {
  try {
    let cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, msg: "Please enter your email" };
    }

    // 🔍 Check Firestore first
    const q = query(
      collection(firestore, "users"),
      where("email", "==", cleanEmail)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, msg: "Email is not registered" };
    }

    // 📩 Send reset email
    await sendPasswordResetEmail(auth, cleanEmail);

    return { success: true };

  } catch (error: any) {
    let msg = error.message;
    console.log("reset password error:", msg);

    if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
    if (msg.includes("(auth/too-many-requests)"))
      msg = "Too many requests, try again later";

    return { success: false, msg };
  }
};

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};
