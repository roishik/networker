import type { Contact } from "@shared/schema";

interface DuplicateModalProps {
  duplicates: Contact[];
  onConfirm: (action: string, contactId?: string) => void;
  onCancel: () => void;
}

export default function DuplicateModal({ duplicates, onConfirm, onCancel }: DuplicateModalProps) {
  if (duplicates.length === 0) return null;

  const handleMerge = (contactId: string) => {
    onConfirm('merge', contactId);
  };

  const handleCreateNew = () => {
    onConfirm('create');
  };

  const getInitials = (contact: Contact) => {
    const name = contact.englishName || contact.hebrewName || 'Unknown';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Possible Duplicate</h3>
          <p className="text-slate-600">
            We found {duplicates.length} similar contact{duplicates.length > 1 ? 's' : ''}. 
            {duplicates.length === 1 ? ' Is this the same person?' : ' Which one matches?'}
          </p>
        </div>

        {/* Existing Contact Previews */}
        <div className="space-y-3 mb-6">
          {duplicates.map((contact) => (
            <div key={contact.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(contact)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-slate-800">
                      {contact.englishName || contact.hebrewName || 'Unknown'}
                    </h4>
                    {contact.hebrewName && contact.englishName && (
                      <span className="text-sm text-slate-500">{contact.hebrewName}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {[contact.company, contact.jobTitle].filter(Boolean).join(' • ') || 'No details'}
                  </p>
                </div>
                {duplicates.length === 1 && (
                  <button
                    onClick={() => handleMerge(contact.id)}
                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Same person
                  </button>
                )}
              </div>
              {duplicates.length > 1 && (
                <button
                  onClick={() => handleMerge(contact.id)}
                  className="w-full mt-2 px-3 py-2 bg-primary text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  This is the same person
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleCreateNew}
            className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            No, create new contact
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
