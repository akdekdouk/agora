"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

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
