import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats', {
        headers: auth.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const handleBack = () => {
    setLocation('/');
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/export/csv', {
        headers: auth.getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'networker-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Export completed! Check your downloads."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Export failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center">
        <button 
          onClick={handleBack}
          className="p-2 text-slate-500 hover:text-slate-700 mr-3"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="font-semibold text-slate-800">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials(user.name)}
              </div>
              <div>
                <h3 className="font-medium text-slate-800">{user.name}</h3>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Options */}
        <div className="p-4 space-y-4">
          {/* Export Data */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">Data Management</h3>
            <button 
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-download text-slate-600"></i>
                <div className="text-left">
                  <p className="text-slate-800 font-medium">Export to CSV</p>
                  <p className="text-sm text-slate-600">Download all contacts and interactions</p>
                </div>
              </div>
              <i className="fas fa-chevron-right text-slate-400"></i>
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">Preferences</h3>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-language text-slate-600"></i>
                <div>
                  <p className="text-slate-800 font-medium">Default Language</p>
                  <p className="text-sm text-slate-600">For name detection</p>
                </div>
              </div>
              <select className="border border-slate-300 rounded px-2 py-1 text-sm">
                <option>Hebrew + English</option>
                <option>English Only</option>
                <option>Hebrew Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-bell text-slate-600"></i>
                <div>
                  <p className="text-slate-800 font-medium">Follow-up Reminders</p>
                  <p className="text-sm text-slate-600">Coming soon</p>
                </div>
              </div>
              <div className="w-10 h-6 bg-slate-300 rounded-full relative cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">About</h3>
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-800 font-medium">Version</span>
                <span className="text-slate-600">0.1.0 MVP</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-800 font-medium">Contacts</span>
                <span className="text-slate-600">{stats?.totalContacts || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-medium">Interactions</span>
                <span className="text-slate-600">{stats?.totalInteractions || 0}</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-6">
            <button 
              onClick={handleSignOut}
              className="w-full py-3 text-red-600 font-medium hover:bg-red-50 transition-colors rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
