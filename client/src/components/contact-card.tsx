import type { Contact } from "@shared/schema";

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const getInitials = (contact: Contact) => {
    const name = contact.englishName || contact.hebrewName || 'Unknown';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRandomGradient = (id: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-orange-500 to-red-600',
      'from-purple-500 to-pink-600',
      'from-indigo-500 to-blue-600',
      'from-teal-500 to-green-600'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'No recent activity';
    
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

  const getStatusColor = (contact: Contact) => {
    if (!contact.updatedAt) return 'bg-slate-300';
    
    const date = new Date(contact.updatedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 3) return 'bg-green-400';
    if (days <= 7) return 'bg-blue-400';
    if (days <= 30) return 'bg-yellow-400';
    return 'bg-slate-300';
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start space-x-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${getRandomGradient(contact.id)} rounded-full flex items-center justify-center text-white font-semibold`}>
          {getInitials(contact)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-slate-800 truncate">
              {contact.englishName || contact.hebrewName || 'Unknown'}
            </h3>
            {contact.hebrewName && contact.englishName && (
              <span className="text-sm text-slate-500 truncate">{contact.hebrewName}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate">
            {[contact.company, contact.jobTitle].filter(Boolean).join(' • ') || 'No company info'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Last: {formatDate(contact.updatedAt)}
          </p>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
          <div className={`w-2 h-2 ${getStatusColor(contact)} rounded-full`} title="Activity status"></div>
        </div>
      </div>
    </div>
  );
}
