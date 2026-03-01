"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      await fetchRequests(user);
      await fetchFriends(user);
    };

    init();
  }, []);

  const fetchRequests = async (user: any) => {
    const { data } = await supabase
      .from("friend_requests")
      .select(`
        id,
        sender_id,
        profiles!friend_requests_sender_id_fkey (
          id,
          username
        )
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (data) setRequests(data);
  };

  const fetchFriends = async (user: any) => {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (!data) return;

    const friendIds = data.map((f: any) =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", friendIds);

    if (friendProfiles) setFriends(friendProfiles);
  };

  const handleAccept = async (request: any) => {
    // Update status
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", request.id);

    // Create friendship
    await supabase.from("friendships").insert({
      user_id_1: request.sender_id,
      user_id_2: currentUser.id,
    });

    alert("Friend request accepted!");
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {/* Pending Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Pending Requests</h2>

        {requests.length === 0 && <p>No pending requests</p>}

        {requests.map((req) => (
          <div key={req.id} className="border p-4 mb-3 flex justify-between items-center">
            <Link
              href={`/profile/${req.profiles?.username}`}
              className="text-blue-600 font-bold"
            >
              {req.profiles?.username}
            </Link>

            <button
              onClick={() => handleAccept(req)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Accept
            </button>
          </div>
        ))}
      </div>

      {/* Friends List */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Friends</h2>

        {friends.length === 0 && <p>No friends yet</p>}

        {friends.map((friend) => (
          <div key={friend.id} className="border p-4 mb-3">
            <Link
              href={`/profile/${friend.username}`}
              className="text-blue-600 font-bold"
            >
              {friend.username}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}