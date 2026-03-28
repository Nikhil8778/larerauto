import { createMessageTemplate } from "./actions";

export default function AddTemplateForm() {
  return (
    <form
      action={createMessageTemplate}
      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="text-2xl font-black text-slate-900">Add Message Template</div>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Create reusable WhatsApp, SMS, and email templates for workshop outreach.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700">Template Name</label>
          <input
            name="name"
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Sudbury Intro WhatsApp"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Channel</label>
          <select
            name="channel"
            defaultValue="whatsapp"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="whatsapp">whatsapp</option>
            <option value="sms">sms</option>
            <option value="email">email</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Audience</label>
          <select
            name="audience"
            defaultValue="workshop"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="workshop">workshop</option>
            <option value="mechanic">mechanic</option>
            <option value="retail">retail</option>
            <option value="general">general</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">Active</label>
          <select
            name="isActive"
            defaultValue="true"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Email Subject</label>
          <input
            name="subject"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="Optional, mostly for email templates"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Media URL</label>
          <input
            name="mediaUrl"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder="https://www.lareauto.ca/marketing/flyer-1.jpg"
          />
          <p className="mt-2 text-xs font-medium text-slate-500">
            Optional. Mostly useful for WhatsApp templates with image/flyer creatives.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Template Body</label>
          <textarea
            name="body"
            required
            rows={8}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            placeholder={`Hi {{shopName}},\n\nWe are LARE Auto. We supply quality auto parts across Ontario with competitive pricing and fast sourcing.\n\nWe can share pricing for your commonly used parts.\n\nwww.lareauto.ca`}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
      >
        Save Template
      </button>
    </form>
  );
}