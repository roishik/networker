import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { useState } from "react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import MiniGraph from "@/components/mini-graph";
import type { Contact, Interaction } from "@shared/schema";

export default function ContactDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/contact/:id");
  const contactId = params?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [interactionText, setInteractionText] = useState('');
  const { toast } = useToast();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['/api/contacts', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json() as Promise<Contact>;
    },
    enabled: !!contactId
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['/api/contacts', contactId, 'interactions'],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch interactions');
      return response.json() as Promise<Interaction[]>;
    },
    enabled: !!contactId
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Contact>) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
      setIsEditing(false);
    }
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders()
        },
        body: JSON.stringify({ body })
      });
      if (!response.ok) throw new Error('Failed to add interaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId, 'interactions'] });
      toast({
        title: "Success",
        description: "Interaction added successfully"
      });
      setInteractionText('');
      setShowAddInteraction(false);
    }
  });

  const handleBack = () => {
    setLocation('/');
  };

  const handleEdit = () => {
    if (contact) {
      setFormData(contact);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddInteraction = () => {
    if (interactionText.trim()) {
      addInteractionMutation.mutate(interactionText);
    }
  };

  const handleCancelInteraction = () => {
    setInteractionText('');
    setShowAddInteraction(false);
  };

  const getInitials = (contact: Contact) => {
    const name = contact.englishName || contact.hebrewName || 'Unknown';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h3 className="text-lg font-medium text-slate-800 mb-2">Contact not found</h3>
        <button onClick={handleBack} className="text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="p-2 text-slate-500 hover:text-slate-700"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="font-semibold text-slate-800">Contact Details</h1>
        <button 
          onClick={isEditing ? handleSave : handleEdit}
          disabled={updateMutation.isPending}
          className="p-2 text-slate-500 hover:text-slate-700"
        >
          <i className={`fas fa-${isEditing ? 'check' : 'edit'}`}></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Contact Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {getInitials(contact)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-xl font-semibold text-slate-800">
                  {contact.englishName || 'Unknown'}
                </h2>
                {contact.hebrewName && (
                  <span className="text-lg text-slate-600">{contact.hebrewName}</span>
                )}
              </div>
              <p className="text-slate-600">
                {contact.jobTitle} {contact.company && `at ${contact.company}`}
              </p>
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  {contact.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Fields */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">English Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.englishName || ''} 
                  onChange={(e) => handleFieldChange('englishName', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                  {contact.englishName || 'Not provided'}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hebrew Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.hebrewName || ''} 
                  onChange={(e) => handleFieldChange('hebrewName', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                  {contact.hebrewName || 'Not provided'}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.company || ''} 
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                  {contact.company || 'Not provided'}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.jobTitle || ''} 
                  onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                  {contact.jobTitle || 'Not provided'}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How We Met</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.howMet || ''} 
                  onChange={(e) => handleFieldChange('howMet', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                  {contact.howMet || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mini Graph */}
        <div className="p-4 border-t border-slate-200">
          <h3 className="font-medium text-slate-800 mb-3">Connections</h3>
          <MiniGraph contactId={contactId!} />
        </div>

        {/* Interaction Timeline */}
        <div className="p-4 border-t border-slate-200">
          <h3 className="font-medium text-slate-800 mb-3">Interaction Timeline</h3>
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <div key={interaction.id} className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-comment text-white text-xs"></i>
                  </div>
                  {index < interactions.length - 1 && <div className="w-px bg-slate-200 h-8"></div>}
                </div>
                <div className="flex-1 pb-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-slate-800 text-sm">{interaction.body}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatDate(interaction.occurredAt || interaction.createdAt || '')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Interaction Field */}
          {showAddInteraction ? (
            <div className="mt-4 space-y-3">
              <textarea
                value={interactionText}
                onChange={(e) => setInteractionText(e.target.value)}
                placeholder="Describe your interaction..."
                className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddInteraction}
                  disabled={addInteractionMutation.isPending || !interactionText.trim()}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addInteractionMutation.isPending ? 'Saving...' : 'Save Interaction'}
                </button>
                <button
                  onClick={handleCancelInteraction}
                  disabled={addInteractionMutation.isPending}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddInteraction(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Interaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
