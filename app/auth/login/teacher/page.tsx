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
import { BookOpen, Phone, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getTollFreeNumber } from "@/lib/config";

export default function TeacherLoginPage() {
  const [formData, setFormData] = useState({
    phoneNumber: "",
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
        // Redirect teacher to teacher dashboard section
        router.push("/dashboard");
      } else {
        toast.error("Teacher not found. Please register first.");
        router.push("/auth/register/teacher");
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
            <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
          </Link>
          <CardTitle>Teacher Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your teaching dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
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
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have a teacher account?{" "}
              <Link
                href="/auth/register/teacher"
                className="text-green-600 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center">
              You can also access Classless via:
              <br />
              SMS: Text to {getTollFreeNumber("sms")} | Call:{" "}
              {getTollFreeNumber("voice")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
