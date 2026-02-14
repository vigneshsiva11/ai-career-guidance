"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { BookOpen, Phone, Hash, Lock, GraduationCap } from "lucide-react";
import { setStoredLanguage, useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

export default function SignInPage() {
  const lang = useLanguage();
  const [formData, setFormData] = useState({
    userType: "",
    phoneNumber: "",
    studentId: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Client-side validation
      const phone = formData.phoneNumber.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
      if (!isValidPhone) {
        toast.error("Please enter a valid phone number");
        setIsLoading(false);
        return;
      }
      if (
        formData.userType === "student" &&
        formData.studentId.trim() &&
        !/^\d{1,20}$/.test(formData.studentId.trim())
      ) {
        toast.error("Student ID should contain digits only");
        setIsLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.phoneNumber,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        localStorage.setItem("classless_user", JSON.stringify(result.data));
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error("User not found. Please register first.");
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {t(lang, "app_name")}
            </h1>
          </Link>
          <CardTitle>{t(lang, "login_title", "Welcome Back")}</CardTitle>
          <CardDescription>{t(lang, "login_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">I am a</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) =>
                  setFormData({ ...formData, userType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Student</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Global Language Switcher */}
            <div className="space-y-2">
              <Label htmlFor="lang">App Language</Label>
              <select
                id="lang"
                className="w-full border rounded px-3 py-2 text-sm"
                onChange={(e) => setStoredLanguage(e.target.value as any)}
                value={lang}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="bn">Bengali</option>
                <option value="te">Telugu</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="pa">Punjabi</option>
                <option value="ur">Urdu</option>
                <option value="or">Odia</option>
                <option value="as">Assamese</option>
                <option value="sa">Sanskrit</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[0-9+\-\s()]*$/.test(next)) {
                      setFormData({ ...formData, phoneNumber: next });
                    }
                  }}
                  className="pl-10"
                  inputMode="tel"
                  pattern="^[0-9+\-\s()]{7,20}$"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            {formData.userType === "student" && (
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (/^\d*$/.test(next)) {
                        setFormData({ ...formData, studentId: next });
                      }
                    }}
                    className="pl-10"
                    inputMode="numeric"
                    pattern="^\d{1,20}$"
                    maxLength={20}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.userType}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
