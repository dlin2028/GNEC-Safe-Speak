'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function fetchPlaceholderContacts(currentUser: string): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockContacts = ['1234567890', '2345678901', '3456789012', '4567890123'];
      resolve(mockContacts.filter(phone => phone !== currentUser)); // no curr user
    }, 500);
  });
}

export default function Contacts() {
  const [currentUser, setCurrentUser] = useState('');
  const [contacts, setContacts] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('phoneNumber');
    if (stored) {
      setCurrentUser(stored);
      fetchPlaceholderContacts(stored).then(setContacts);
    } else {
      setContacts(['1234567890', '9876543210']);
    }
  }, []);

  const handleContactClick = (contact: string) => {
    router.push(`/chat/${contact}`); // Navigate to chat page for the contact
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Contacts</h1>
      <p className="mb-6">Logged in as: <strong>{currentUser || 'unknown user'}</strong></p>

      <div className="grid grid-cols-2 gap-4">
        {contacts.map((num, i) => (
          <div
            key={i}
            onClick={() => handleContactClick(num)}
            className="bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer transition"
          >
            {num}
          </div>
        ))}
      </div>
    </main>
  );
}
