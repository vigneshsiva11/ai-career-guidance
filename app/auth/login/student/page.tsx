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
import { BookOpen, Lock, ArrowLeft, Hash } from "lucide-react";
import { toast } from "sonner";

export default function StudentLoginPage() {
  const [formData, setFormData] = useState({
    rollNumber: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Client-side validation
      const roll = formData.rollNumber.trim();
      if (!/^\d{1,20}$/.test(roll)) {
        toast.error("Roll number should contain digits only");
        setIsLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }
      const mappedPhone = localStorage.getItem(`classless_roll_to_phone_${roll}`);
      const lookupPhone = mappedPhone || roll;
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: lookupPhone,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        localStorage.setItem("classless_user", JSON.stringify(result.data));
        toast.success("Login successful!");
        // Redirect student to student dashboard
        router.push("/dashboard");
      } else {
        toast.error(
          result.error ||
            "Login failed. Try your parent mobile number if roll number does not work for older accounts."
        );
        // Do not redirect; allow user to correct input
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
          <CardTitle>Student Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your learning dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="Enter your roll number"
                  value={formData.rollNumber}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^\d*$/.test(next)) {
                      setFormData({ ...formData, rollNumber: next });
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have a student account?{" "}
              <Link
                href="/auth/register/student"
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
