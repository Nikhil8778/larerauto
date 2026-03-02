export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-black md:text-3xl">Customer Reviews</h1>
        <p className="mt-2 text-sm font-semibold text-white/70">
          As you collect reviews on Google, we can embed them here. For now, this page is ready.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-black">Google Reviews (embed later)</div>
        <p className="mt-2 text-sm font-semibold text-white/70">
          Once your Google Business Profile is created, we’ll paste the embed code here.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-black">On-site Reviews (optional)</div>
        <p className="mt-2 text-sm font-semibold text-white/70">
          We can also build a simple form that stores reviews in your database (Supabase) with approval/moderation.
        </p>
      </div>
    </div>
  );
}
