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
import { BookOpen, Phone, User, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function TeacherRegisterPage() {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic client-side validation
      const phone = formData.phoneNumber.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
      const name = formData.fullName.trim();
      const isValidName = /^[A-Za-z\s'.-]{2,80}$/.test(name);
      if (!isValidPhone) {
        toast.error("Please enter a valid phone number");
        setIsLoading(false);
        return;
      }
      if (!isValidName) {
        toast.error("Please enter a valid full name");
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
          phone_number: formData.phoneNumber,
          name: formData.fullName,
          user_type: "teacher",
          preferred_language: "en",
          teacher_email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Best-effort cookie login; do not block dashboard navigation on this.
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: formData.phoneNumber,
            password: formData.password,
          }),
        }).catch(() => {});

        if (!result.data) {
          toast.error("Registration completed but user profile is missing. Please sign in.");
          router.push("/auth/login/teacher");
          return;
        }
        localStorage.setItem("classless_user", JSON.stringify(result.data));
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
          <CardTitle>Teacher Registration</CardTitle>
          <CardDescription>
            Create your teacher account to guide students with AI tutoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                  className="pl-10"
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
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
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
                  placeholder="Create a strong password"
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
              {isLoading ? "Creating Account..." : "Create Teacher Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have a teacher account?{" "}
              <Link
                href="/auth/login/teacher"
                className="text-green-600 hover:underline"
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
