import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, lastname, firstname } = await req.json();

  try {
    // Call Django backend with corrected field names
    const response = await fetch("http://localhost:8000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstname,
        last_name: lastname,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const { id, first_name, last_name } = data;

      return NextResponse.json({
        message: "Registration successful",
        id,
        firstName: first_name,
        lastName: last_name,
        redirectUrl: `/role/user/${id}`,
      });
    } else {
      return NextResponse.json(
        { error: data.error || "Registration failed" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
