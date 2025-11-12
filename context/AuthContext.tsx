// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; // 1. Import signOut
import { auth } from '@/lib/ConfigFirebase';
import { useRouter } from 'next/navigation'; // 2. Import useRouter

// 3. Tambahkan 'logout' ke dalam tipe interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>; // Fungsi logout yang akan kita buat
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 4. Inisialisasi router

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 5. Implementasikan fungsi logout di sini
  const logout = async () => {
    try {
      await signOut(auth);
      // Setelah berhasil logout, onAuthStateChanged di atas akan otomatis
      // mengupdate state 'user' menjadi null.
      
      // Arahkan pengguna ke halaman login setelah logout
      router.replace('/login'); // Ganti dengan rute yang sesuai
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
      // Anda bisa menambahkan notifikasi error untuk pengguna di sini
    }
  };

  return (
    // 6. Sediakan fungsi 'logout' ke semua komponen anak melalui 'value'
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};