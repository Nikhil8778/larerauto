import { NextRequest, NextResponse } from "next/server";
import { getChatbotQuote } from "@/lib/chatbotQuote";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await getChatbotQuote({
      make: String(body.make || ""),
      model: String(body.model || ""),
      year: Number(body.year || 0),
      engine: String(body.engine || ""),
      partType: String(body.partType || ""),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quote found successfully.",
      result: result.result,
    });
  } catch (error) {
    console.error("POST /api/chatbot/quote error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching quote.",
      },
      { status: 500 }
    );
  }
}