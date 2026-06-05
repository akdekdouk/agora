"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface ConsumerSession {
  user?: { name?: string | null; email?: string | null; consumerId?: string };
}

export default function Navbar() {
  const { data: session } = useSession();
  const [consumerSession, setConsumerSession] = useState<ConsumerSession | null>(null);

  useEffect(() => {
    fetch("/api/consumer/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.consumerId) setConsumerSession(data);
      })
      .catch(() => {});
  }, []);

  async function signOutConsumer() {
    await fetch("/api/consumer/auth/signout", { method: "POST" });
    setConsumerSession(null);
    window.location.reload();
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-orange-500">
          Agora
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/merchants" className="text-gray-600 hover:text-orange-500 font-medium">
            Merchants
          </Link>
          <Link href="/search" className="text-gray-600 hover:text-orange-500 font-medium">
            Search
          </Link>

          {/* Consumer section — only shown when logged in */}
          {consumerSession?.user?.consumerId && (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <span className="text-sm text-gray-500">
                {consumerSession.user.name ?? consumerSession.user.email}
              </span>
              <Link href="/consumer/dashboard" className="text-gray-600 hover:text-orange-500 font-medium text-sm">
                My saves
              </Link>
              <button
                onClick={signOutConsumer}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Merchant section */}
          {session ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-orange-500 font-medium">
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
