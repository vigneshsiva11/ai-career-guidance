"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { BookOpen, Phone, User, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    name: "",
    userType: "",
    preferredLanguage: "en",
    location: "",
    rollNumber: "",
    classStandard: "",
    gender: "",
    password: "",
    teacherEmail: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pre-fill phone number if coming from login
    const phone = searchParams.get("phone");
    if (phone) {
      setFormData((prev) => ({ ...prev, phoneNumber: phone }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic client-side validation
      const phone = formData.phoneNumber.trim();
      const name = formData.name.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const isValidPhone =
        /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
        phoneDigits.length >= 10 &&
        phoneDigits.length <= 15;
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
      if (
        formData.userType === "student" &&
        formData.rollNumber.trim() &&
        !/^\d{1,20}$/.test(formData.rollNumber.trim())
      ) {
        toast.error("Roll number should contain digits only");
        setIsLoading(false);
        return;
      }
      if (formData.password && formData.password.length < 6) {
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
          name: formData.name,
          user_type: formData.userType,
          roll_number: formData.userType === "student" ? formData.rollNumber : undefined,
          preferred_language: formData.preferredLanguage,
          location: formData.location,
          education_level: formData.classStandard || undefined,
          teacher_email: formData.teacherEmail || undefined,
          password: formData.password || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Best-effort cookie login; dashboard navigation should not fail because of this.
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: formData.phoneNumber,
            password: formData.password,
          }),
        }).catch(() => {});

        // Store user info in localStorage
        if (!result.data) {
          toast.error("Registration completed but user profile is missing. Please sign in.");
          router.push("/auth/login");
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
            href="/"
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
          </Link>
          <CardTitle>Join Classless</CardTitle>
          <CardDescription>
            Create your account to start learning with AI tutoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    // Allow digits, +, -, spaces, parentheses; prevent letters
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
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[A-Za-z\s'.-]*$/.test(next)) {
                      setFormData({ ...formData, name: next });
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
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferredLanguage: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="pa">Punjabi</SelectItem>
                  <SelectItem value="bn">Bengali</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {formData.userType === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Student Roll Number</Label>
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
                    inputMode="numeric"
                    pattern="^\d{1,20}$"
                    maxLength={20}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classStandard">Class Standard</Label>
                  <Select
                    value={formData.classStandard}
                    onValueChange={(value) =>
                      setFormData({ ...formData, classStandard: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your class" />
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

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={6}
                    required
                  />
                </div>
              </>
            )}

            {formData.userType === "teacher" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teacherEmail">Teacher Email</Label>
                  <Input
                    id="teacherEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.teacherEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, teacherEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-teacher">Password</Label>
                  <Input
                    id="password-teacher"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={6}
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.userType}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline"
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
