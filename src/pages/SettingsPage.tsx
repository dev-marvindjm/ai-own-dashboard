import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Switch } from '@/components/common/Switch';
import { getProfile, getPreferences } from '@/services/rustApi';
import { User, Settings as SettingsIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<any>({});
  const [prefs, setPrefs] = useState<any>({});

  useEffect(() => {
    async function loadData() {
      try {
        const p = await getProfile();
        setProfile(p);
        const pref = await getPreferences();
        setPrefs(pref);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    loadData();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-slate-50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input defaultValue={profile?.username || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input defaultValue={profile?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" defaultValue={profile?.email || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telegram ID</label>
                  <Input defaultValue={profile?.telegram_id || ''} />
                </div>
                <div className="pt-4">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-medium">Allow Any Sender</p>
                    <p className="text-sm text-slate-500">Process signals from unverified senders automatically.</p>
                  </div>
                  <Switch checked={prefs?.allow_any_sender || false} />
                </div>
                <div className="pt-2">
                  <Button>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" />
                </div>
                <div className="pt-4">
                  <Button>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
