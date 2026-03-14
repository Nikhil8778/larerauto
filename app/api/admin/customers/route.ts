import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { whatsappNumber: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: {
          orders: true,
          invoices: true,
          conversations: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customer = await prisma.customer.create({
      data: {
        firstName: String(body.firstName ?? "").trim(),
        lastName: body.lastName ? String(body.lastName).trim() : null,
        email: body.email ? String(body.email).trim().toLowerCase() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        whatsappNumber: body.whatsappNumber ? String(body.whatsappNumber).trim() : null,
        companyName: body.companyName ? String(body.companyName).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    });

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    console.error("customer create error", error);
    return NextResponse.json({ error: "Unable to create customer." }, { status: 500 });
  }
}