import { SocialChannel, SocialPlatform } from "@prisma/client";
import { deleteSocialChannel, toggleSocialChannel } from "./actions";

function platformLabel(platform: SocialPlatform) {
  switch (platform) {
    case "FACEBOOK":
      return "Facebook";
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    default:
      return platform;
  }
}

export default function ChannelsTable({
  channels,
}: {
  channels: SocialChannel[];
}) {
  if (!channels.length) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        No social channels found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Platform</th>
            <th className="px-4 py-3 text-left">Display Name</th>
            <th className="px-4 py-3 text-left">Handle</th>
            <th className="px-4 py-3 text-left">Profile URL</th>
            <th className="px-4 py-3 text-left">Connection</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.id} className="border-b last:border-0">
              <td className="px-4 py-3">{platformLabel(channel.platform)}</td>
              <td className="px-4 py-3">{channel.displayName}</td>
              <td className="px-4 py-3">{channel.handle || "-"}</td>
              <td className="px-4 py-3">
                <a
                  href={channel.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Open
                </a>
              </td>
              <td className="px-4 py-3">{channel.connectionType}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    channel.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {channel.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleSocialChannel(channel.id, !channel.isActive);
                    }}
                  >
                    <button type="submit" className="rounded-lg border px-3 py-1">
                      {channel.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await deleteSocialChannel(channel.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-red-300 px-3 py-1 text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}