"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

export async function submitMechanicSignup(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = emptyToNull(formData.get("phone"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!shopName) {
    throw new Error("Shop name is required.");
  }

  if (!contactName) {
    throw new Error("Contact name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const existingMechanic = await prisma.mechanic.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingMechanic) {
    throw new Error("A mechanic account already exists with this email.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (token) {
    const customer = await prisma.customer.findFirst({
      where: {
        mechanicInviteToken: token,
      },
      include: {
        convertedWorkshopLead: true,
      },
    });

    if (!customer) {
      throw new Error("Invalid signup link.");
    }

    if (!customer.mechanicInviteExpiresAt || customer.mechanicInviteExpiresAt < new Date()) {
      throw new Error("This signup link has expired.");
    }

    if (customer.mechanicSignupCompletedAt) {
      throw new Error("This signup link has already been used.");
    }

    await prisma.mechanic.create({
      data: {
        shopName,
        contactName,
        email,
        phone,
        passwordHash,
        isApproved: false,
        isActive: true,
        notes: `Signup source: invite. Completed on ${new Date().toLocaleString()}. Waiting for admin approval.`,
      },
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        isMechanicEligible: true,
        mechanicEligibleAt: customer.mechanicEligibleAt ?? new Date(),
        mechanicSignupCompletedAt: new Date(),
        mechanicInviteToken: null,
        mechanicInviteExpiresAt: null,
      },
    });

    if (customer.convertedWorkshopLead) {
      await prisma.outreachLeadFollowUp.create({
        data: {
          workshopLeadId: customer.convertedWorkshopLead.id,
          note: `Customer completed mechanic self-signup through invite. Admin approval pending.`,
          followUpAt: null,
          status: "done",
        },
      });
    }
  } else {
    await prisma.mechanic.create({
      data: {
        shopName,
        contactName,
        email,
        phone,
        passwordHash,
        isApproved: false,
        isActive: true,
        notes: `Signup source: public. Completed on ${new Date().toLocaleString()}. Waiting for admin approval.`,
      },
    });
  }

  redirect("/mechanic-signup/success");
}