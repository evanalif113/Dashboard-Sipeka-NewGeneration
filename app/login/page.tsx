"use client";

import type React from "react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "@/lib/FetchingAuth";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Minimal 8 karakter");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Satu huruf kecil");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Satu huruf kapital");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Satu angka");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Satu karakter spesial");
    }

    let color = "text-red-500";
    if (score >= 4) color = "text-green-500";
    else if (score >= 3) color = "text-yellow-500";
    else if (score >= 2) color = "text-orange-500";

    return { score, feedback, color };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (only for sign up)
    if (isSignUp && !formData.name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi";
    } else if (isSignUp && formData.name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Mohon masukkan alamat email yang valid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Kata sandi wajib diisi";
    } else if (isSignUp) {
      const strength = getPasswordStrength(formData.password);
      if (strength.score < 3) {
        newErrors.password = "Kata sandi terlalu lemah";
      }
    }

    // Confirm password validation (only for sign up)
    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Mohon konfirmasi kata sandi Anda";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Kata sandi tidak cocok";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle input blur
  const handleInputBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate individual field on blur
    const newErrors: FormErrors = {};

    if (field === "email" && formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Mohon masukkan alamat email yang valid";
    }

    if (field === "password" && isSignUp && formData.password) {
      const strength = getPasswordStrength(formData.password);
      if (strength.score < 3) {
        newErrors.password = "Kata sandi terlalu lemah";
      }
    }

    if (
      field === "confirmPassword" &&
      isSignUp &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Kata sandi tidak cocok";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        // Sign up with Firebase
        await signUpWithEmail(
          formData.email,
          formData.password,
          formData.name
        );
      } else {
        // Sign in with Firebase
        await signInWithEmail(formData.email, formData.password);
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Autentikasi gagal. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle between sign in and sign up
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
    setTouched({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden  bg-white dark:bg-slate-900">
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 dark:text-gray-100 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center items-center mb-4">
            <Image
              src="/img/favicon.ico"
              alt="logo"
              width={100}
              height={100}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            SIPEKA
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {isSignUp
              ? "Buat akun Anda untuk menggunakan dashboard"
              : "Masuk dengan akun Anda untuk mengakses dashboard"}
          </CardDescription>
        </CardHeader>

        {/* Toggle Buttons */}
        <div className="px-6 pb-4">
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => !isSignUp && toggleMode()}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                !isSignUp
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Daftar
            </button>
            <button
              type="button"
              onClick={() => isSignUp && toggleMode()}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                isSignUp
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Masuk
            </button>
          </div>
        </div>

        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukan Nama Anda"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onBlur={() => handleInputBlur("name")}
                    className={`pl-10 ${
                      errors.name
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                    }`}
                    required={isSignUp}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleInputBlur("email")}
                  className={`pl-10 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                  }`}
                  required
                />
                {formData.email && validateEmail(formData.email) && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi Anda"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => handleInputBlur("password")}
                  className={`pl-10 pr-10 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                  }`}
                  required
                />
                <button
                  type="button"
                  aria-label="Toggle Password Visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator (Sign Up Only) */}
              {isSignUp && formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 4
                            ? "bg-green-500"
                            : passwordStrength.score >= 3
                            ? "bg-yellow-500"
                            : passwordStrength.score >= 2
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.score >= 4
                        ? "Kuat"
                        : passwordStrength.score >= 3
                        ? "Baik"
                        : passwordStrength.score >= 2
                        ? "Cukup"
                        : "Lemah"}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>Kata sandi membutuhkan:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Konfirmasi Kata Sandi
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi kata sandi yang telah Anda buat"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleInputBlur("confirmPassword")}
                    className={`pl-10 pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                    }`}
                    required={isSignUp}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                    )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {isSignUp ? "Membuat Akun..." : "Masuk..."}
                </div>
              ) : isSignUp ? (
                "Buat Akun"
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
              >
                {isSignUp ? "Masuk di sini" : "Daftar di sini"}
              </button>
            </p>
          </div>

          {!isSignUp && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline transition-colors"
              >
                Lupa Kata Sandi?
              </button>
            </div>
          )}
          {/* Theme Switch */}
          <div className="mt-4 flex justify-center">
            <ThemeSwitch />
          </div>
          {/* Tombol kembali ke halaman awal */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
            >
              Kembali ke Halaman Awal
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
