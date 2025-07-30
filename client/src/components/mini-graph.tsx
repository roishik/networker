import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import type { Edge, Contact } from "@shared/schema";

interface MiniGraphProps {
  contactId: string;
}

export default function MiniGraph({ contactId }: MiniGraphProps) {
  const { data: edges = [] } = useQuery({
    queryKey: ['/api/contacts', contactId, 'edges'],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/edges`, {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch edges');
      return response.json() as Promise<Edge[]>;
    }
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts?limit=1000', {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json() as Promise<Contact[]>;
    }
  });

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const getInitials = (contact: Contact) => {
    const name = contact.englishName || contact.hebrewName || 'Unknown';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const currentContact = getContactById(contactId);

  if (edges.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 h-32 flex items-center justify-center border border-slate-200">
        <div className="text-center">
          <i className="fas fa-project-diagram text-slate-400 text-2xl mb-2"></i>
          <p className="text-slate-500 text-sm">No connections yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="space-y-4">
        {edges.map((edge) => {
          const isSource = edge.sourceContactId === contactId;
          const otherContactId = isSource ? edge.targetContactId : edge.sourceContactId;
          const otherContact = getContactById(otherContactId);
          
          if (!otherContact || !currentContact) return null;

          const relationLabel = edge.relationType === 'introduced_by' ? 
            (isSource ? 'introduced' : 'intro\'d by') : 
            'same company';

          return (
            <div key={edge.id} className="flex items-center space-x-4">
              {/* Source Contact */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {isSource ? getInitials(currentContact) : getInitials(otherContact)}
                </div>
                <span className="text-xs text-slate-600 mt-1 max-w-[60px] truncate">
                  {isSource ? 
                    (currentContact.englishName || currentContact.hebrewName || 'Me') :
                    (otherContact.englishName || otherContact.hebrewName || 'Unknown')
                  }
                </span>
              </div>

              {/* Relationship */}
              <div className="flex-1 flex items-center">
                <div className="flex-1 h-px bg-slate-300"></div>
                <div className="bg-slate-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {relationLabel}
                </div>
                <div className="flex-1 h-px bg-slate-300"></div>
              </div>

              {/* Target Contact */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {isSource ? getInitials(otherContact) : getInitials(currentContact)}
                </div>
                <span className="text-xs text-slate-600 mt-1 max-w-[60px] truncate">
                  {isSource ? 
                    (otherContact.englishName || otherContact.hebrewName || 'Unknown') :
                    (currentContact.englishName || currentContact.hebrewName || 'Me')
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-slate-500 mt-3">
        <i className="fas fa-info-circle"></i>
        Interactive graph coming in future updates
      </p>
    </div>
  );
}
