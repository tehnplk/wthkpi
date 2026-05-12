import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { signToken, setTokenCookie } from "@/lib/auth";
import { comparePassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const user = await db("users")
      .where("username", username)
      .where("is_active", true)
      .first();

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    await db("users").where("id", user.id).update({
      last_login: db.fn.now(),
    });

    const token = await signToken({
      id: user.id,
      provider_id: user.provider_id,
      fullname: user.fullname,
      username: user.username,
      department_id: user.department_id,
      is_active: user.is_active,
      role: user.role || "user",
    });

    const { name, value, options } = setTokenCookie(token);

    const response = NextResponse.json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      department_id: user.department_id,
      role: user.role || "user",
    });

    response.cookies.set(name, value, options);
    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
