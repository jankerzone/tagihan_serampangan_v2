"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  loadUserProfile, 
  saveUserProfile, 
  getCurrentUser, 
  hashPassword, 
  checkPassword, 
  loadUsers, 
  saveUsers,
  getPrefixedKey,
  t
} from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [userProfile, setUserProfile] = useState(loadUserProfile());
  const [newName, setNewName] = useState(userProfile?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const profile = loadUserProfile();
    if (profile) {
      setUserProfile(profile);
      setNewName(profile.name);
    } else {
      // This case should ideally not happen if Login.tsx initializes correctly
      // but as a fallback, create a default profile
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`;
      const newProfile = { name: currentUser, avatar: defaultAvatar };
      saveUserProfile(newProfile);
      setUserProfile(newProfile);
      setNewName(currentUser);
    }
  }, [currentUser, navigate]);

  const handleUpdateName = () => {
    if (!newName.trim()) {
      showError(t('requiredFields'));
      return;
    }
    if (userProfile) {
      const updatedProfile = { ...userProfile, name: newName.trim() };
      saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      showSuccess(t('nameUpdated'));
    }
  };

  const handleGenerateNewAvatar = () => {
    if (userProfile) {
      const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      const updatedProfile = { ...userProfile, avatar: newAvatar };
      saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      showSuccess(t('avatarUpdated'));
    }
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showError(t('requiredFields'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError(t('passwordsMismatch'));
      return;
    }

    const users = loadUsers();
    if (currentUser && users[currentUser]) {
      const storedHash = users[currentUser];
      if (checkPassword(currentPassword, storedHash)) {
        const newHashedPassword = hashPassword(newPassword);
        const updatedUsers = { ...users, [currentUser]: newHashedPassword };
        saveUsers(updatedUsers);
        showSuccess(t('passwordUpdated'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        showError(t('invalidCurrentPassword'));
      }
    } else {
      showError(t('passwordUpdateFailed'));
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-600">{t('loading')}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('backToDashboard')}
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('profileSettings')} 👤</h1>
          </div>
        </div>

        {/* Current Profile Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <img src={userProfile.avatar} alt="User Avatar" className="w-20 h-20 rounded-full border-2 border-gray-200" />
            <div>
              <p className="text-xl font-semibold">{userProfile.name}</p>
              <p className="text-gray-500 text-sm">{currentUser}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Name */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('editName')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newName">{t('name')}</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('name')}
              />
            </div>
            <Button onClick={handleUpdateName} className="w-full">{t('updateName')}</Button>
          </CardContent>
        </Card>

        {/* Change Avatar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('changeAvatar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateNewAvatar} className="w-full">
              {t('generateNewAvatar')}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('changePassword')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPassword')}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPassword')}
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t('confirmPassword')}
              />
            </div>
            <Button onClick={handleUpdatePassword} className="w-full">{t('updatePassword')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;