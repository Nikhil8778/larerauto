import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rules = await prisma.autoReplyRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rule = await prisma.autoReplyRule.create({
      data: {
        name: String(body.name ?? "").trim(),
        channel: String(body.channel ?? "all").trim(),
        triggerType: String(body.triggerType ?? "welcome").trim(),
        triggerValue: body.triggerValue ? String(body.triggerValue).trim() : null,
        replyTemplate: String(body.replyTemplate ?? "").trim(),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });

    return NextResponse.json({ ok: true, rule });
  } catch (error) {
    console.error("automation create error", error);
    return NextResponse.json({ error: "Unable to create automation rule." }, { status: 500 });
  }
}