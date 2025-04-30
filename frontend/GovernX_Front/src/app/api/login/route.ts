// app/api/login/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    // Call Spring Boot backend for login
    const response = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Send the token back to the client (not as a cookie)

      return NextResponse.json({
        token: data.token,
        redirectUrl: data.redirectUrl,
        idUtilisateur: data.idUtilisateur,
      });
    } else {
      return NextResponse.json(
        { error: data.error || "Login failed" },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
