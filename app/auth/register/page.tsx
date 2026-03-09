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
import { BookOpen, Phone, User, Lock, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import { EDUCATION_LEVEL_OPTIONS } from "@/lib/education-levels";
import { GoogleSSOButton } from "@/components/auth/google-sso-button";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userType: "student",
    phoneNumber: "",
    name: "",
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
      const phone = formData.phoneNumber.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
      const name = formData.name.trim();
      const isValidName = /^[A-Za-z\s'.-]{2,80}$/.test(name);
      const email = formData.email.trim().toLowerCase();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValidPhone) {
        toast.error("Please enter a valid phone number");
        setIsLoading(false);
        return;
      }
      if (!isValidName) {
        toast.error("Name is required");
        setIsLoading(false);
        return;
      }
      if (!isValidEmail) {
        toast.error("Please enter a valid email");
        setIsLoading(false);
        return;
      }
      if (!formData.educationLevel.trim()) {
        toast.error("Education Level is required");
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password minimum length is 6 characters");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: formData.phoneNumber,
          name: formData.name,
          email,
          user_type: formData.userType,
          education_level: formData.educationLevel,
          preferred_language: "en",
          password: formData.password,
        }),
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        toast.error(result.error || "Registration failed");
        return;
      }

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
        router.replace("/auth/signin");
        return;
      }

      localStorage.setItem("classless_user", JSON.stringify(loginResult.data));
      toast.success("Registration successful!");
      router.replace("/");
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
            href="/"
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classless</h1>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Join Classless</CardTitle>
          <CardDescription className="text-slate-600">
            Continue with Google or create your account manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <GoogleSSOButton educationLevel={formData.educationLevel} requireEducationLevel />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">I am a</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger className="rounded-xl border-slate-300 focus-visible:ring-blue-500">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[0-9+\-\s()]*$/.test(next)) setFormData({ ...formData, phoneNumber: next });
                  }}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationLevel">Education Level</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 text-white shadow-md transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-indigo-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
