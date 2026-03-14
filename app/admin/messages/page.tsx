import { prisma } from "@/lib/prisma";

export default async function AdminMessagesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      customer: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Messages</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Central inbox for customer conversations across channels.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="text-sm font-bold text-slate-900">
                    {conversation.customer
                      ? `${conversation.customer.firstName} ${conversation.customer.lastName ?? ""}`
                      : "Unknown customer"}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {conversation.channel}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {conversation.messages[0]?.content ?? "No messages yet."}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Conversation View</h2>
          <div className="mt-5 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
            Detailed conversation pane comes next.
          </div>
        </div>
      </div>
    </div>
  );
}