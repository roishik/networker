import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { parseNoteText } from "@/lib/text-parser";
import { useToast } from "@/hooks/use-toast";
import DuplicateModal from "@/components/duplicate-modal";
import type { Contact } from "@shared/schema";

interface ParseResult {
  duplicates?: Contact[];
  parsed: any;
  requiresConfirmation?: boolean;
  contact?: Contact;
  created?: boolean;
}

export default function AddNotePage() {
  const [, setLocation] = useLocation();
  const [noteText, setNoteText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders()
        },
        body: JSON.stringify({ body })
      });
      
      if (!response.ok) throw new Error('Failed to save note');
      return response.json() as Promise<ParseResult>;
    },
    onSuccess: (result) => {
      if (result.requiresConfirmation) {
        setParseResult(result);
      } else {
        toast({
          title: "Success",
          description: result.created ? "New contact created!" : "Contact updated!"
        });
        setLocation('/');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ action, contactId }: { action: string; contactId?: string }) => {
      const response = await fetch('/api/notes/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders()
        },
        body: JSON.stringify({
          action,
          contactId,
          parsed: parseResult?.parsed,
          body: noteText
        })
      });
      
      if (!response.ok) throw new Error('Failed to confirm');
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: result.merged ? "Contact updated!" : "New contact created!"
      });
      setLocation('/');
    }
  });

  const handleSave = () => {
    if (!noteText.trim()) return;
    saveMutation.mutate(noteText);
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleConfirm = (action: string, contactId?: string) => {
    confirmMutation.mutate({ action, contactId });
    setParseResult(null);
  };

  // Real-time parsing preview
  const parsed = parseNoteText(noteText);
  const hasDetections = parsed.englishName || parsed.hebrewName || parsed.company || parsed.jobTitle || parsed.introducedBy;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="p-2 text-slate-500 hover:text-slate-700"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="font-semibold text-slate-800">Add Note</h1>
        <button 
          onClick={handleSave}
          disabled={!noteText.trim() || saveMutation.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="flex-1 p-4">
        <div className="h-64">
          <textarea 
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type your note here... e.g., 'Met Dana from StarkTech, VP R&D, intro'd by Gil. Follow up on pilot discussion next week.'"
            className="w-full h-full p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 placeholder-slate-400"
            autoFocus
          />
        </div>

        {/* Parsing Preview */}
        {noteText.trim() && hasDetections && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-800 mb-2">Smart Detection:</h3>
            <div className="space-y-2 text-sm">
              {parsed.englishName && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-user text-primary w-4"></i>
                  <span className="text-slate-600">Name:</span>
                  <span className="font-medium text-slate-800">{parsed.englishName}</span>
                </div>
              )}
              {parsed.hebrewName && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-user text-primary w-4"></i>
                  <span className="text-slate-600">Hebrew Name:</span>
                  <span className="font-medium text-slate-800">{parsed.hebrewName}</span>
                </div>
              )}
              {parsed.company && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-building text-primary w-4"></i>
                  <span className="text-slate-600">Company:</span>
                  <span className="font-medium text-slate-800">{parsed.company}</span>
                </div>
              )}
              {parsed.jobTitle && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-briefcase text-primary w-4"></i>
                  <span className="text-slate-600">Title:</span>
                  <span className="font-medium text-slate-800">{parsed.jobTitle}</span>
                </div>
              )}
              {parsed.introducedBy && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-handshake text-primary w-4"></i>
                  <span className="text-slate-600">Introduced by:</span>
                  <span className="font-medium text-slate-800">{parsed.introducedBy}</span>
                </div>
              )}
              {parsed.howMet && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt text-primary w-4"></i>
                  <span className="text-slate-600">How met:</span>
                  <span className="font-medium text-slate-800">{parsed.howMet}</span>
                </div>
              )}
              {parsed.followUpDate && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-calendar text-primary w-4"></i>
                  <span className="text-slate-600">Follow-up:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(parsed.followUpDate).toLocaleString()}
                  </span>
                </div>
              )}
              {parsed.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-tags text-primary w-4"></i>
                  <span className="text-slate-600">Tags:</span>
                  <div className="flex space-x-1">
                    {parsed.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              <i className="fas fa-info-circle"></i>
              You can edit these details after saving
            </p>
          </div>
        )}
      </div>

      {/* Duplicate Detection Modal */}
      {parseResult && (
        <DuplicateModal
          duplicates={parseResult.duplicates || []}
          onConfirm={handleConfirm}
          onCancel={() => setParseResult(null)}
        />
      )}
    </div>
  );
}
