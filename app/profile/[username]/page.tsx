"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [requestSentByMe, setRequestSentByMe] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!data) return;

      setProfile(data);

      const { data: userPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false });

      if (userPosts) setPosts(userPosts);

      if (!user) return;

      // Check friendship
      const { data: friendships } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (friendships) {
        const match = friendships.some(
          (f: any) =>
            (f.user_id_1 === user.id && f.user_id_2 === data.id) ||
            (f.user_id_1 === data.id && f.user_id_2 === user.id)
        );

        if (match) {
          setIsFriend(true);
          return;
        }
      }

      // Check pending request
      const { data: requests } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("status", "pending");

      if (requests) {
        const pending = requests.find(
          (r: any) =>
            (r.sender_id === user.id && r.receiver_id === data.id) ||
            (r.sender_id === data.id && r.receiver_id === user.id)
        );

        if (pending) {
          setRequestPending(true);
          if (pending.sender_id === user.id) {
            setRequestSentByMe(true);
          }
        }
      }
    };

    fetchData();
  }, [username]);

  const handleUnfriend = async () => {
    if (!currentUser) return;

    await supabase
      .from("friendships")
      .delete()
      .match({
        user_id_1: currentUser.id,
        user_id_2: profile.id,
      });

    await supabase
      .from("friendships")
      .delete()
      .match({
        user_id_1: profile.id,
        user_id_2: currentUser.id,
      });

    alert("Unfriended successfully");
    setIsFriend(false);
  };

  const handleAddFriend = async () => {
    if (!currentUser) return;

    if (currentUser.id === profile.id) {
      alert("Cannot add yourself");
      return;
    }

    const { error } = await supabase.from("friend_requests").insert({
      sender_id: currentUser.id,
      receiver_id: profile.id,
      status: "pending",
    });

    if (!error) {
      setRequestPending(true);
      setRequestSentByMe(true);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUser) return;

    await supabase
      .from("friend_requests")
      .delete()
      .match({
        sender_id: currentUser.id,
        receiver_id: profile.id,
        status: "pending",
      });

    alert("Friend request cancelled");
    setRequestPending(false);
    setRequestSentByMe(false);
  };

  if (!profile) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <div className="border p-4 mb-6">
        <h1 className="text-2xl font-bold">@{profile.username}</h1>

        {currentUser && currentUser.id === profile.id && (
          <Link
            href="/edit-profile"
            className="inline-block mt-2 text-sm text-blue-600"
          >
            Edit Profile
          </Link>
        )}

        {/* Friends */}
        {currentUser &&
          currentUser.id !== profile.id &&
          isFriend && (
            <button
              onClick={handleUnfriend}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
            >
              Unfriend
            </button>
          )}

        {/* Pending - Sent by me */}
        {currentUser &&
          currentUser.id !== profile.id &&
          requestPending &&
          requestSentByMe && (
            <button
              onClick={handleCancelRequest}
              className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Cancel Request
            </button>
          )}

        {/* Pending - Received by me */}
        {currentUser &&
          currentUser.id !== profile.id &&
          requestPending &&
          !requestSentByMe && (
            <button
              disabled
              className="mt-3 bg-gray-400 text-white px-4 py-2 rounded"
            >
              Request Received
            </button>
          )}

        {/* No relationship */}
        {currentUser &&
          currentUser.id !== profile.id &&
          !isFriend &&
          !requestPending && (
            <button
              onClick={handleAddFriend}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Friend
            </button>
          )}

        <p className="mt-2">{profile.full_name}</p>
        <p className="text-gray-500">{profile.bio}</p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border p-4">
            <p>{post.content}</p>
            <small className="text-gray-500">
              {new Date(post.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}