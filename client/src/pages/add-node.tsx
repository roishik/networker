import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { parseNoteText } from "@/lib/text-parser";
import { useToast } from "@/hooks/use-toast";
import DuplicateModal from "@/components/duplicate-modal";
import type { Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ParseResult {
  duplicates?: Contact[];
  parsed: any;
  requiresConfirmation?: boolean;
  contact?: Contact;
  created?: boolean;
}

export default function AddNodePage() {
  const [, setLocation] = useLocation();
  const [nodeText, setNodeText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [aiExtractedData, setAiExtractedData] = useState<any | null>(null);
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await apiRequest('POST', '/api/nodes', { body });
      return await response.json();
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
      const response = await apiRequest('POST', '/api/nodes/confirm', {
        action,
        contactId,
        parsed: parseResult?.parsed,
        body: nodeText
      });
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: result.merged ? "Contact updated!" : "New contact created!"
      });
      setLocation('/');
    }
  });

  const aiExtractMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/nodes/extract-ai', { text });
      return await response.json();
    },
    onSuccess: (result) => {
      setAiExtractedData(result);
      toast({
        title: "AI Extraction Complete",
        description: "Fields extracted successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "AI extraction failed. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!nodeText.trim()) return;
    
    // If we have AI extracted data, use it directly for contact creation
    if (aiExtractedData) {
      handleAiDataSave();
    } else {
      saveMutation.mutate(nodeText);
    }
  };

  const handleAiDataSave = async () => {
    try {
      // Create contact directly with AI extracted data
      const response = await apiRequest('POST', '/api/nodes/confirm', {
        action: 'create',
        parsed: aiExtractedData,
        body: nodeText
      });
      const result = await response.json();

      toast({
        title: "Success",
        description: "Contact created with AI data!"
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact with AI data",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleConfirm = (action: string, contactId?: string) => {
    confirmMutation.mutate({ action, contactId });
    setParseResult(null);
  };

  // Real-time parsing preview
  const parsed = parseNoteText(nodeText);
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
        <h1 className="font-semibold text-slate-800">Add a Node</h1>
        <button 
          onClick={handleSave}
          disabled={!nodeText.trim() || saveMutation.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : aiExtractedData ? 'Save AI Data' : 'Save'}
        </button>
      </header>

      <div className="flex-1 p-4">
        <div className="h-64">
          <textarea 
            value={nodeText}
            onChange={(e) => setNodeText(e.target.value)}
            placeholder="Type your node here... e.g., 'Met Dana from StarkTech, VP R&D, intro'd by Gil. Follow up on pilot discussion next week.'"
            className="w-full h-full p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 placeholder-slate-400"
            autoFocus
          />
        </div>

        {/* Parsing Preview */}
        {nodeText.trim() && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-800">Smart Detection:</h3>
              <div className="flex space-x-2">
                {!aiExtractedData && (
                  <button
                    onClick={() => aiExtractMutation.mutate(nodeText)}
                    disabled={aiExtractMutation.isPending}
                    className="flex items-center space-x-2 text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-robot text-purple-600"></i>
                    <span>{aiExtractMutation.isPending ? 'Extracting...' : 'Extract with AI'}</span>
                  </button>
                )}
                {aiExtractedData && (
                  <button
                    onClick={() => setAiExtractedData(null)}
                    className="flex items-center space-x-2 text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <i className="fas fa-undo text-slate-600"></i>
                    <span>Use Auto-Parse</span>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {aiExtractedData ? (
                // Show AI-extracted data
                <>
                  {Object.entries(aiExtractedData).map(([key, value]) => {
                    if (key === 'tags' && Array.isArray(value)) {
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <i className="fas fa-tags text-primary w-4"></i>
                          <span className="text-slate-600">Tags:</span>
                          <div className="flex space-x-1">
                            {value.map((tag: string) => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (value && typeof value === 'string') {
                      const icons: Record<string, string> = {
                        englishName: 'fa-user',
                        hebrewName: 'fa-user',
                        company: 'fa-building',
                        jobTitle: 'fa-briefcase',
                        howMet: 'fa-map-marker-alt',
                        followUpDate: 'fa-calendar',
                        family: 'fa-users',
                        notes: 'fa-sticky-note'
                      };
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <i className={`fas ${icons[key] || 'fa-info-circle'} text-primary w-4`}></i>
                          <span className="text-slate-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-slate-800">{
                            key === 'followUpDate' ? new Date(value).toLocaleString() : value
                          }</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </>
              ) : hasDetections ? (
                // Show regex-parsed data
                <>
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
                    {new Date(parsed.followUpDate).toLocaleDateString('en-GB')} {new Date(parsed.followUpDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              )}
              {parsed.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-tags text-primary w-4"></i>
                  <span className="text-slate-600">Tags:</span>
                  <div className="flex space-x-1">
                    {parsed.tags.map(tag => (
                      <span key={tag} className="text-slate-600 text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </>
              ) : (
                // No regex detections found
                <div className="text-center py-4">
                  <i className="fas fa-info-circle text-slate-400 text-lg mb-2"></i>
                  <p className="text-slate-600 text-sm">No automatic detections found</p>
                  <p className="text-slate-500 text-xs">Try using AI extraction for better results</p>
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
