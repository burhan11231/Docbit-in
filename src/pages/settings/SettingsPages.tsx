import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SettingsGeneral() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
        <p className="text-sm text-slate-500 mt-1">Update your account's profile information and email address.</p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
          {(user?.full_name || 'U')[0].toUpperCase()}
        </div>
        <Button variant="outline">Change Avatar</Button>
      </div>

      <div className="space-y-4">
        <Input label="Full Name" defaultValue={user?.full_name} />
        <Input label="Email Address" type="email" defaultValue={user?.email} />
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}

export function SettingsSecurity() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Update Password</h2>
        <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      <div className="space-y-4">
        <Input label="Current Password" type="password" />
        <Input label="New Password" type="password" />
        <Input label="Confirm Password" type="password" />
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Update Password</Button>
      </div>
      
      <div className="pt-8 mt-8 border-t border-red-100">
         <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
         <p className="text-sm text-slate-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
         <Button variant="danger">Delete Account</Button>
      </div>
    </div>
  );
}
