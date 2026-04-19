"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Phone,
  User,
  Building,
  Lock,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { EDUCATION_LEVEL_OPTIONS } from "@/lib/education-levels";
import { GoogleSSOButton } from "@/components/auth/google-sso-button";

export default function StudentRegisterPage() {
  const [formData, setFormData] = useState({
    mobileNumber: "",
    fullName: "",
    email: "",
    educationLevel: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const phone = formData.mobileNumber.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
      const name = formData.fullName.trim();
      const isValidName = /^[A-Za-z\s'.-]{2,80}$/.test(name);
      const email = formData.email.trim().toLowerCase();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValidPhone) {
        toast.error("Please enter a valid mobile number");
        setIsLoading(false);
        return;
      }
      if (!isValidName) {
        toast.error("Please enter a valid full name");
        setIsLoading(false);
        return;
      }
      if (!isValidEmail) {
        toast.error("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
      if (!formData.educationLevel.trim()) {
        toast.error("Education Level is required");
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: formData.mobileNumber,
          name: formData.fullName,
          email,
          user_type: "student",
          preferred_language: "en",
          education_level: formData.educationLevel,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            identifier: email,
            password: formData.password,
          }),
        });
        const loginResult = await loginResponse.json();
        if (!loginResult.success || !loginResult.data) {
          toast.error("Registration succeeded, but auto-login failed. Please sign in.");
          router.push("/auth/login/student");
          return;
        }

        if (!result.data) {
          toast.error(
            "Registration completed but user profile is missing. Please sign in."
          );
          router.push("/auth/login/student");
          return;
        }
        localStorage.setItem("classless_user", JSON.stringify(loginResult.data));
        window.dispatchEvent(new Event("classless:auth-changed"));
        toast.success("Registration successful!");
        router.replace("/dashboard");
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <Card className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <Link
            href="/auth/login"
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classless
            </h1>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Student Registration
          </CardTitle>
          <CardDescription className="text-slate-600">
            Create your student account to start learning with AI tutoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <GoogleSSOButton
              educationLevel={formData.educationLevel}
              requireEducationLevel
            />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={formData.mobileNumber}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[0-9+\-\s()]*$/.test(next)) {
                      setFormData({ ...formData, mobileNumber: next });
                    }
                  }}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  inputMode="tel"
                  pattern="^[0-9+\-\s()]{7,20}$"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[A-Za-z\s'.-]*$/.test(next)) {
                      setFormData({ ...formData, fullName: next });
                    }
                  }}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  inputMode="text"
                  pattern="^[A-Za-z\s'.-]{2,80}$"
                  maxLength={80}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationLevel">Education Level</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, educationLevel: value })
                  }
                >
                  <SelectTrigger className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 shadow-md transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Student Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have a student account?{" "}
              <Link
                href="/auth/login/student"
                className="text-indigo-600 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
