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
import {
  BookOpen,
  Phone,
  User,
  Hash,
  Building,
  Users,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentRegisterPage() {
  const [formData, setFormData] = useState({
    parentMobile: "",
    fullName: "",
    rollNumber: "",
    standard: "",
    gender: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic client-side validation
      const phone = formData.parentMobile.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
      const name = formData.fullName.trim();
      const isValidName = /^[A-Za-z\s'.-]{2,80}$/.test(name);
      if (!isValidPhone) {
        toast.error("Please enter a valid parent mobile number");
        setIsLoading(false);
        return;
      }
      if (!isValidName) {
        toast.error("Please enter a valid full name");
        setIsLoading(false);
        return;
      }
      if (!/^\d{1,20}$/.test(formData.rollNumber.trim())) {
        toast.error("Roll number should contain digits only");
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
          phone_number: formData.parentMobile,
          name: formData.fullName,
          user_type: "student",
          preferred_language: "en",
          education_level: formData.standard,
          roll_number: formData.rollNumber,
          gender: formData.gender,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Best-effort cookie login; dashboard access should not be blocked by this call.
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: formData.parentMobile,
            password: formData.password,
          }),
        }).catch(() => {});

        // Map roll number to phone for student login
        if (formData.rollNumber) {
          localStorage.setItem(
            `classless_roll_to_phone_${formData.rollNumber.trim()}`,
            result.data?.phone_number || formData.parentMobile
          );
        }
        if (!result.data) {
          toast.error("Registration completed but user profile is missing. Please sign in.");
          router.push("/auth/login/student");
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
          <CardTitle>Student Registration</CardTitle>
          <CardDescription>
            Create your student account to start learning with AI tutoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentMobile">Parent Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="parentMobile"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={formData.parentMobile}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[0-9+\-\s()]*$/.test(next)) {
                      setFormData({ ...formData, parentMobile: next });
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
              <Label htmlFor="standard">Standard</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={formData.standard}
                  onValueChange={(value) =>
                    setFormData({ ...formData, standard: value })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 6">Class 6</SelectItem>
                    <SelectItem value="Class 7">Class 7</SelectItem>
                    <SelectItem value="Class 8">Class 8</SelectItem>
                    <SelectItem value="Class 9">Class 9</SelectItem>
                    <SelectItem value="Class 10">Class 10</SelectItem>
                    <SelectItem value="Class 11">Class 11</SelectItem>
                    <SelectItem value="Class 12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
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
              {isLoading ? "Creating Account..." : "Create Student Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have a student account?{" "}
              <Link
                href="/auth/login/student"
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
