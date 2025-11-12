"use client"

import { useEffect, useState, type FormEvent } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useRouter } from "next/navigation"
import {
  getUserProfile,
  signOutUser,
  updateUserProfileData,
  updateUserPassword,
  deleteUserAccount,
  type UserProfile,
} from "@/lib/FetchingAuth"
import { auth } from "@/lib/ConfigFirebase"
import { Timestamp } from "firebase/firestore"
import { LogOut } from "lucide-react"
import Loading from "@/app/loading"

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form states
  const [displayName, setDisplayName] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI states
  const [editStatus, setEditStatus] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const profile = await getUserProfile(currentUser.uid)
          if (profile) {
            setUserProfile(profile)
            setDisplayName(profile.displayName)
          } else {
            setError("Could not find user profile.")
          }
        } catch (err) {
          setError("Failed to fetch user profile.")
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !userProfile) return
    setEditStatus(null)
    if (displayName === userProfile.displayName) {
      setEditStatus({ message: "No changes to save.", type: "error" })
      return
    }
    try {
      await updateUserProfileData(user.uid, displayName)
      setEditStatus({ message: "Profil berhasil diperbarui", type: "success" })
      setUserProfile((prev) => (prev ? { ...prev, displayName } : null))
    } catch (err: any) {
      setEditStatus({ message: err.message, type: "error" })
    }
  }

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)
    if (!oldPassword) {
      setPasswordStatus({ message: "Current password is required.", type: "error" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ message: "Passwords do not match.", type: "error" })
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ message: "Password should be at least 6 characters.", type: "error" })
      return
    }
    try {
      await updateUserPassword(oldPassword, newPassword)
      setPasswordStatus({ message: "Password updated successfully!", type: "success" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordStatus({ message: err.message, type: "error" })
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    if (!deletePassword) {
      setDeleteError("Password is required to delete your account.")
      return
    }
    try {
      await deleteUserAccount(deletePassword)
      // onAuthStateChanged will redirect
    } catch (err: any) {
      setDeleteError(err.message)
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
    router.push("/login")
  }

  // Helper function to format date
  const formatDateTime = (date: Date | Timestamp) => {
    const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  if (loading) {
    return <Loading/>
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error: {error}</div>
  }
  
  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Profile Info */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Profil Pengguna</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <p className="text-gray-700 dark:text-gray-200">
            <strong className="font-semibold text-gray-900 dark:text-gray-100 mr-1">Nama:</strong>
            {userProfile.displayName}
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            <strong className="font-semibold text-gray-900 dark:text-gray-100 mr-1">Email:</strong>
            {userProfile.email}
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            <strong className="font-semibold text-gray-900 dark:text-gray-100 mr-2">Role:</strong>
            <span className="rounded-full border border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-sm text-blue-800 dark:text-blue-300">
              {userProfile.role}
            </span>
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            <strong className="font-semibold text-gray-900 dark:text-gray-100 mr-1">Terdaftar sejak:</strong>
            {formatDateTime(userProfile.createdAt)}
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            <strong className="font-semibold text-gray-900 dark:text-gray-100 mr-1">Masuk terakhir:</strong>
            {formatDateTime(userProfile.lastLoginAt)}
          </p>
        </div>
      </div>

      {/* Edit Profile & Change Password - Side by Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Edit Profile */}
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Edit Profil</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Profil</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
              />
            </div>
            {editStatus && (
              <p className={`text-sm ${editStatus.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {editStatus.message}
              </p>
            )}
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Simpan Perubahan
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Ubah Kata Sandi</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password lama</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password baru</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password baru</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
              />
            </div>
            {passwordStatus && (
              <p className={`text-sm ${passwordStatus.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {passwordStatus.message}
              </p>
            )}
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Perbarui Kata Sandi
            </button>
          </form>
        </div>
      </div>

      {/* Zona Bahaya */}
      <div className="rounded-lg border-2 border-dashed border-red-500 bg-white dark:bg-slate-900 p-6 shadow-md">
        <h2 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">Zona Bahaya</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Hapus akun ini</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Setelah Anda menghapus akun Anda, tidak ada jalan kembali. Harap pastikan.</p>
          </div>
          <button onClick={() => setIsDeleteConfirmVisible(true)} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Hapus Akun
          </button>
        </div>
        {isDeleteConfirmVisible && (
          <div className="mt-4 rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4">
            <h3 className="font-bold text-red-800 dark:text-red-300">Konfirmasi Penghapusan Akun</h3>
            <p className="text-sm text-red-700 dark:text-red-400">Untuk mengonfirmasi, silakan masukkan kata sandi Anda.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
              placeholder="Enter your password"
            />
            {deleteError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteConfirmVisible(false)}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
              >
                Batal
              </button>
              <button onClick={handleDeleteAccount} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Konfirmasi & Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        <LogOut className="mr-2 h-5 w-5" />
        Keluar
      </button>
    </div>
  )
}

export default ProfilePage
