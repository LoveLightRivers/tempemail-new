/*
 * The main page for the TempEmail application.  This page allows users to
 * generate disposable email addresses, select an address to view messages
 * stored in Supabase, and prompts the user to upgrade after a limited
 * number of uses.  All client‑side interactions live here so that the
 * experience feels instant without requiring page reloads.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

// Define the domain used for all generated email addresses.  You can
// override this via the NEXT_PUBLIC_APP_URL environment variable or
// customise the domain here directly.
const EMAIL_DOMAIN = 'tempemail.pro';

interface Message {
  id: number;
  email: string;
  subject: string | null;
  body: string | null;
  created_at: string;
}

export default function Home() {
  // List of generated email addresses in the current session.
  const [addresses, setAddresses] = useState<string[]>([]);
  // The currently selected email address whose messages are displayed.
  const [selected, setSelected] = useState<string | null>(null);
  // Messages for the selected email address.  These are fetched from Supabase.
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Number of times the user has generated an email address.  Used to
  // determine when to show the upgrade prompt.
  const [generateCount, setGenerateCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generate a random string for the local part of the email address.
  function randomLocalPart() {
    return Math.random().toString(36).substring(2, 12);
  }

  // Create a new email address, insert it into Supabase and update UI.
  async function handleGenerateAddress() {
    const localPart = randomLocalPart();
    const address = `${localPart}@${EMAIL_DOMAIN}`;

    // Insert into Supabase 'emails' table.  If the table does not exist
    // this call will silently fail; see Supabase dashboard for setup.
    try {
      await supabase.from('emails').insert([{ address }]);
    } catch (error) {
      console.error('Failed to insert email into Supabase:', error);
    }
    setAddresses((prev) => [address, ...prev]);
    setSelected(address);
    setGenerateCount((count) => count + 1);
  }

  // Fetch messages for the currently selected address whenever it changes.
  useEffect(() => {
    async function fetchMessages() {
      if (!selected) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      // Query the 'messages' table for messages sent to this address.  The
      // table schema should include columns: id, email, subject, body,
      // created_at.  Results are ordered by newest first.
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('email', selected)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch messages:', error);
      }
      setMessages((data as Message[]) || []);
      setLoadingMessages(false);
    }
    fetchMessages();
  }, [selected]);

  // Show upgrade modal after three email generations to encourage users to
  // upgrade to paid tiers.  Reset occurs by reloading the page.
  useEffect(() => {
    if (generateCount > 2) {
      setShowUpgradeModal(true);
    }
  }, [generateCount]);

  // Copy an email address to the clipboard.
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert('Email address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col items-center md:items-start gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">TempEmail</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Generate disposable email addresses for testing and one‑time use
        </p>
        <button
          onClick={handleGenerateAddress}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
        >
          Generate New Email
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with generated addresses */}
        <aside className="lg:w-1/4 flex-shrink-0">
          <h2 className="text-xl font-semibold mb-4">Your Addresses</h2>
          {addresses.length === 0 && (
            <p className="text-sm text-gray-500">No addresses generated yet.</p>
          )}
          <ul className="space-y-2">
            {addresses.map((addr) => (
              <li
                key={addr}
                className={`p-2 rounded-md cursor-pointer border ${
                  selected === addr ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelected(addr)}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate max-w-[80%]" title={addr}>{addr}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(addr);
                    }}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content displaying messages */}
        <main className="flex-1">
          {selected ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Inbox for {selected}</h2>
              {loadingMessages ? (
                <p>Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500">No messages found. Try sending an email to this address.</p>
              ) : (
                <ul className="space-y-3">
                  {messages.map((msg) => (
                    <li key={msg.id} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium truncate max-w-[70%]">
                          {msg.subject || 'No subject'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line">
                        {msg.body || '(no content)'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-gray-500">Select or generate an address to view messages.</p>
          )}
        </main>
      </div>

      {/* Upgrade modal overlay */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md max-w-md w-full">
            <h3 className="text-xl font-semibold mb-2">Upgrade Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You have reached the limit of free email addresses. Upgrade to unlock unlimited usage and additional features.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md"
              >
                Cancel
              </button>
              <a
                href="#"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
