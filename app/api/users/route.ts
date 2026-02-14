import { type NextRequest, NextResponse } from "next/server";
import { createUser, getUserByPhone, getAllUsers } from "@/lib/database";
import type { CreateUserRequest, ApiResponse, User } from "@/lib/types";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest & {
      password?: string;
      email?: string;
      role?: string;
      roll_number?: string;
    } = await request.json();

    // Validate required fields
    if (!body.phone_number || !body.name || !body.user_type) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Missing required fields: phone_number, name, user_type",
        },
        { status: 400 }
      );
    }

    // Server-side strong validation
    const phone = String(body.phone_number).trim();
    const name = String(body.name).trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const isValidPhone =
      /^\+?[0-9\-\s()]{7,20}$/.test(phone) &&
      phoneDigits.length >= 10 &&
      phoneDigits.length <= 15;
    const isValidName = /^[A-Za-z\s'.-]{2,80}$/.test(name);
    if (!isValidPhone) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    if (!isValidName) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid name format" },
        { status: 400 }
      );
    }

    await connectDatabase();

    // Check if user already exists by phone/email
    const existingUser = await getUserByPhone(body.phone_number);
    const existingByEmail = body.email
      ? await UserModel.findOne({ email: body.email.toLowerCase() })
      : null;

    if (existingUser || existingByEmail) {
      return NextResponse.json<ApiResponse<User>>({
        success: false,
        error: "User already exists",
      });
    }

    if (!body.password || body.password.length < 6) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create new user
    const newUser = await createUser({
      phone_number: body.phone_number,
      name: name,
      user_type: (body.role as any) || body.user_type,
      roll_number: body.roll_number,
      preferred_language: body.preferred_language || "en",
      location: body.location,
      education_level: body.education_level,
      email: body.email,
      password: hashedPassword,
    });

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (phone) {
      const user = await getUserByPhone(phone);
      if (!user) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<User>>({
        success: true,
        data: user,
      });
    }

    // Return all users
    const users = await getAllUsers();
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
