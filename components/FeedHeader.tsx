"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NotificationType = {
  id: string;
  type: string;
  actor_username: string;
  is_read: boolean;
};

export default function FeedHeader({
  pendingCount,
  notificationCount,
  notifications,
  onLogout,
  onMarkRead,
}: {
  pendingCount: number;
  notificationCount: number;
  notifications: NotificationType[];
  onLogout: () => void;
  onMarkRead: (id?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-bold">Social App</h1>

      <div className="flex gap-6 items-center">

        {/* Friend Requests */}
        <Link href="/friends" className="relative text-xl">
          👥
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-2 rounded-full">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen(!open);
              if (!open) onMarkRead(); // mark all as read when opening
            }}
            className="relative text-xl"
          >
            🔔
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-2 rounded-full animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-72 bg-white shadow-lg rounded-lg border z-50 max-h-80 overflow-y-auto">

              {notifications.length === 0 && (
                <p className="p-4 text-sm text-gray-500">
                  No notifications
                </p>
              )}

              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b text-sm hover:bg-gray-100 cursor-pointer ${
                    !notif.is_read ? "bg-gray-50" : ""
                  }`}
                  onClick={() => onMarkRead(notif.id)}
                >
                  <span className="font-semibold">
                    {notif.actor_username}
                  </span>{" "}
                  {notif.type === "like"
                    ? "liked your post ❤️"
                    : "commented on your post 💬"}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="text-sm text-gray-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}