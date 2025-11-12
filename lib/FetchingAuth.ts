import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  deleteUser,
  type User,
  type AuthError,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/ConfigFirebase"; // Mengimpor instance 'auth' dan 'db' yang sudah diinisialisasi

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: Date | Timestamp
  lastLoginAt: Date | Timestamp
  role: "Admin" | "User"
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update user profile
    await updateProfile(user, { displayName })

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: "User",
    }

    await setDoc(doc(db, "users", user.uid), userProfile)

    return { user, profile: userProfile }
  } catch (error) {
    const authError = error as AuthError
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    const idToken = await userCredential.user.getIdToken();

    document.cookie = `firebaseIdToken=${idToken}; path=/; max-age=3600`;

    // Update last login time
    const userDocRef = doc(db, "users", user.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile
      const updatedProfile = {
        ...profile,
        lastLoginAt: new Date(),
      }
      await setDoc(userDocRef, updatedProfile, { merge: true })
      return { user, profile: updatedProfile }
    } else {
      // Create profile if it doesn't exist (for existing users)
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || email.split("@")[0],
        createdAt: new Date(),
        lastLoginAt: new Date(),
        role: "User",
      }
      await setDoc(userDocRef, userProfile)
      return { user, profile: userProfile }
    }
  } catch (error) {
    const authError = error as AuthError
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error) {
    const authError = error as AuthError
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Update user profile
export const updateUserProfileData = async (uid: string, displayName: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user || user.uid !== uid) {
      throw new Error("Pengguna tidak terautentikasi atau izin ditolak.")
    }

    // Update Firebase Auth profile
    await updateProfile(user, { displayName })

    // Update Firestore profile
    const userDocRef = doc(db, "users", uid)
    await updateDoc(userDocRef, { displayName })
  } catch (error) {
    const authError = error as AuthError
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Update user password
export const updateUserPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error("Pengguna tidak terautentikasi atau email tidak tersedia.")
    }

    // Re-authenticate user with their old password
    const credential = EmailAuthProvider.credential(user.email, oldPassword)
    await reauthenticateWithCredential(user, credential)

    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword)
  } catch (error) {
    const authError = error as AuthError
    if (authError.code === "auth/wrong-password") {
      throw new Error("Password salah.")
    }
    // This error often means the user needs to re-authenticate
    if (authError.code === "auth/requires-recent-login") {
      throw new Error("Operasi ini sensitif dan memerlukan otentikasi terbaru. Silakan keluar dan masuk kembali sebelum mencoba lagi.")
    }
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Delete user account
export const deleteUserAccount = async (password: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error("Pengguna tidak terautentikasi atau email tidak tersedia.")
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)

    // If re-authentication is successful, proceed with deletion
    const uid = user.uid

    // Delete Firestore document first
    const userDocRef = doc(db, "users", uid)
    await deleteDoc(userDocRef)

    // Delete user from Firebase Auth
    await deleteUser(user)
  } catch (error) {
    const authError = error as AuthError
    if (authError.code === "auth/wrong-password") {
      throw new Error("Password salah. Penghapusan gagal.")
    }
    if (authError.code === "auth/requires-recent-login") {
      throw new Error("Operasi ini sensitif dan memerlukan otentikasi terbaru. Silakan keluar dan masuk kembali sebelum mencoba lagi.")
    }
    throw new Error(getAuthErrorMessage(authError.code))
  }
}

// Auth error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "Tidak ditemukan akun dengan email tersebut."
    case "auth/wrong-password":
      return "Password salah. Silakan coba lagi."
    case "auth/email-already-in-use":
      return "Akun dengan email ini sudah ada."
    case "auth/weak-password":
      return "Password harus terdiri dari minimal 6 karakter."
    case "auth/invalid-email":
      return "Silakan masukkan alamat email yang valid."
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan yang gagal. Silakan coba lagi nanti."
    case "auth/network-request-failed":
      return "Kesalahan jaringan. Silakan periksa koneksi Anda."
    default:
      return "Terjadi kesalahan saat melakukan otentikasi. Silakan coba lagi."
  }
}
