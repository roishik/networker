import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { auth } from "@/lib/auth";
import ContactCard from "@/components/contact-card";
import type { Contact } from "@shared/schema";

export default function ContactsPage() {
  const [, setLocation] = useLocation();
  const [offset, setOffset] = useState(0);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', { offset }],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?offset=${offset}&limit=50`, {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json() as Promise<Contact[]>;
    }
  });

  const handleContactClick = (contactId: string) => {
    setLocation(`/contact/${contactId}`);
  };

  const handleAddNode = () => {
    setLocation('/add-node');
  };

  const handleSettings = () => {
    setLocation('/settings');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-network-wired text-white text-sm"></i>
          </div>
          <h1 className="font-semibold text-slate-800">Networker</h1>
        </div>
        <button 
          onClick={handleSettings}
          className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <i className="fas fa-cog"></i>
        </button>
      </header>

      {/* Search Bar (Disabled for MVP) */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed opacity-50"
            disabled
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Search coming soon - scroll to browse</p>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-users text-slate-400 text-xl"></i>
            </div>
            <h3 className="font-medium text-slate-800 mb-2">No contacts yet</h3>
            <p className="text-slate-600 mb-6">Start building your network by adding your first contact</p>
            <button 
              onClick={handleAddNode}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {contacts.map((contact) => (
              <ContactCard 
                key={contact.id} 
                contact={contact} 
                onClick={() => handleContactClick(contact.id)}
              />
            ))}
            
            {contacts.length >= 50 && (
              <div className="flex justify-center py-6">
                <button 
                  onClick={() => setOffset(prev => prev + 50)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-slate-600"
                >
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                  <span className="text-sm">Load more contacts...</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <button 
          onClick={handleAddNode}
          className="w-14 h-14 bg-primary hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>
    </div>
  );
}
