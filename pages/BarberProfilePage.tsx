import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { User, Mail, Lock, Camera, Save, Check, AlertCircle, Loader } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BarberProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // NEW: Store selected file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // NEW: Preview URL
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setAvatarUrl(user.avatar_url || null); // Set actual avatar URL from user object
      setDisplayName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // NEW: Handle file selection (just preview, don't upload yet)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB.");
      return;
    }

    // Store file and create preview
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    toast.info("Image ready to upload. Click 'Save Changes' to apply.");
  };

  // NEW: Upload avatar (called from handleSaveChanges)
  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile || !user?.id) return null;

    try {
      let publicUrl: string | null = null;
      let barberId: string | null = null;
      let oldPhotoUrl: string | null = null;

      // Get barber ID and current photo URL
      try {
        barberId = await api.getBarberIdByUserId(user.id);
        console.log('🔍 Found barber ID:', barberId);

        if (barberId) {
          // Get the current photo URL from barbers table
          const barberData = await api.getBarberById(barberId);
          oldPhotoUrl = barberData?.photo || null;
          console.log('🔍 Current photo URL:', oldPhotoUrl);
        } else {
          console.error('❌ No barber ID found for user:', user.id);
          toast.error("Could not find your barber profile. Please contact support.");
          return null;
        }
      } catch (error) {
        console.error("❌ Failed to get barber data:", error);
        toast.error("Failed to load your profile data.");
        return null;
      }

      // Upload new photo to barber-photos bucket
      const fileName = `barber-${user.id}-${Date.now()}.jpg`;
      console.log('📤 Uploading photo:', fileName);

      try {
        const result = await api.uploadSiteImage(selectedFile, 'barber-photos', fileName);
        publicUrl = result.publicUrl;
        console.log('✅ Upload successful:', publicUrl);
      } catch (uploadError: any) {
        console.error("❌ Upload to 'barber-photos' failed:", uploadError);
        throw new Error("Failed to upload image. Please ensure 'barber-photos' bucket exists.");
      }

      if (!publicUrl) {
        throw new Error("Failed to get image URL");
      }

      // Sync avatar with barbers table
      if (barberId) {
        console.log('🔄 Syncing to barbers table...');
        try {
          await api.updateBarber(barberId, { photo: publicUrl });
          console.log('✅ Barbers table updated successfully');
        } catch (updateError) {
          console.error('❌ Failed to update barbers table:', updateError);
          toast.error("Photo uploaded but failed to update profile. Please refresh the page.");
          return null;
        }
      }

      // Update local state immediately
      setAvatarUrl(publicUrl);

      // Delete old photo from storage AFTER successful upload and DB update
      if (oldPhotoUrl && oldPhotoUrl !== publicUrl) {
        try {
          // Extract the file path from the old URL
          const urlParts = oldPhotoUrl.split('/storage/v1/object/public/');
          if (urlParts.length === 2) {
            const [bucket, ...pathParts] = urlParts[1].split('/');
            const filePath = pathParts.join('/');

            console.log(`🗑️ Deleting old photo: ${bucket}/${filePath}`);

            const { error: deleteError } = await supabase!.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.warn("⚠️ Failed to delete old photo:", deleteError);
            } else {
              console.log("✅ Old photo deleted successfully");
            }
          }
        } catch (deleteError) {
          console.warn("⚠️ Error deleting old photo:", deleteError);
        }
      }

      // Clear selected file and preview
      setSelectedFile(null);
      setPreviewUrl(null);

      return publicUrl;
    } catch (error: any) {
      console.error("❌ Failed to process avatar:", error);
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updates: any = {};
      let hasUpdates = false;

      // 1. Upload avatar if selected
      if (selectedFile) {
        console.log('📸 Uploading selected avatar...');
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          updates.data = { ...updates.data, avatar_url: newAvatarUrl };
          hasUpdates = true;
        }
      }

      // 2. Update Name (Metadata)
      if (displayName !== user?.name) {
        updates.data = { ...updates.data, name: displayName };
        hasUpdates = true;
      }

      // 3. Update Email
      if (email !== user?.email) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast.error("Please enter a valid email address.");
          setIsSaving(false);
          return;
        }
        updates.email = email;
        hasUpdates = true;
      }

      // 4. Update Password
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match!");
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("Password must be at least 6 characters.");
          setIsSaving(false);
          return;
        }
        updates.password = newPassword;
        hasUpdates = true;
      }

      if (!hasUpdates) {
        toast.info("No changes to save.");
        setIsSaving(false);
        return;
      }

      const { error } = await api.auth.updateUser(updates);

      if (error) throw error;

      // Sync name with barbers table if it was updated
      if (displayName !== user?.name && user?.id) {
        try {
          const barberId = await api.getBarberIdByUserId(user.id);
          if (barberId) {
            await api.updateBarber(barberId, { name: displayName });
          }
        } catch (barberUpdateError) {
          console.warn('Failed to update barber name:', barberUpdateError);
          // Don't fail the whole operation
        }
      }

      // Clear password fields
      setNewPassword('');
      setConfirmPassword('');

      toast.success("Profile updated successfully!");

      // Refresh profile
      if (refreshProfile) {
        await refreshProfile();
      }

      if (updates.email) {
        toast.info("Check your new email for a confirmation link.");
      }

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full bg-midnight text-white p-6 overflow-y-auto">
      <ToastContainer theme="dark" position="top-right" aria-label="Notifications" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gold mb-2">My Profile</h1>
        <p className="text-subtle-text text-sm">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* Left Column - Identity */}
        <div className="lg:col-span-1">
          <div className="bg-glass-card border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] rounded-full pointer-events-none" />

            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gold-light/20 to-gold-dark/20 border-2 border-dubai-gold/30 shadow-xl">
                  {/* Show preview if file selected, otherwise show current avatar or initials */}
                  {previewUrl || avatarUrl ? (
                    <img
                      src={previewUrl || avatarUrl || undefined}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-dubai-gold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Camera Overlay Button */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-dubai-gold hover:bg-gold-dark rounded-full p-3 cursor-pointer shadow-lg transition-all duration-300 transform hover:scale-110"
                >
                  <Camera className="w-5 h-5 text-black" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>

              {selectedFile && (
                <p className="mt-2 text-sm text-gold-light">
                  ✓ Image ready to upload
                </p>
              )}

              {isLoading && (
                <div className="mt-4 flex items-center gap-2 text-gold-light">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">{displayName || 'Barber'}</h2>
            <p className="text-subtle-text text-sm mb-6">{email}</p>

            <div className="w-full pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-subtle-text">Role</span>
                <span className="text-gold font-bold uppercase tracking-wider">Barber</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-subtle-text">Member Since</span>
                <span className="text-white">Nov 2023</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-glass-card border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User size={18} className="text-gold" />
              Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">Display Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-subtle-text" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-glass-card border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Lock size={18} className="text-gold" />
              Security Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-subtle-text" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <p className="text-[10px] text-subtle-text mt-2 flex items-center gap-1">
                  <AlertCircle size={10} />
                  Changing email will require confirmation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-subtle-text" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-subtle-text" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-gold-gradient text-midnight px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-glow transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberProfilePage;