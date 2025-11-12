import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProtectedRouteProps {
    children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/autentikasi'); // Ganti dengan rute yang sesuai
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;