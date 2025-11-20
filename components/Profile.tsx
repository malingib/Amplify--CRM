
import React, { useState } from 'react';
import { Mail, Phone, MapPin, MoreHorizontal, ArrowUpRight, Sparkles, LogOut, Shield, Bell, CreditCard, Settings as SettingsIcon, Save, X, Edit2 } from 'lucide-react';
import { UserRole } from '../types';

interface ProfileProps {
    userRole?: UserRole;
    onRoleChange?: (role: UserRole) => void;
}

const Profile: React.FC<ProfileProps> = ({ userRole = 'Admin', onRoleChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: 'Eva Robinson',
        role: 'CEO, Inc. Alabama Machinery & Supply',
        email: 'eva@alabamamachinery.com',
        phone: '+254 712 345 678',
        address: 'Westlands, Nairobi',
        website: 'www.alabamamachinery.com'
    });

    const handleChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
        <div className="flex justify-between items-end mb-2">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Profile</h2>
                <p className="text-slate-500 font-medium mt-1 text-sm">Manage your personal information and account settings.</p>
            </div>
            {isEditing ? (
                <div className="flex gap-2">
                    <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm hover:shadow-md text-xs">
                        <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 text-xs">
                        <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm hover:shadow-md text-xs">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
            )}
        </div>

        {/* Role Switcher for Demo */}
        {onRoleChange && (
            <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                         <h3 className="font-bold text-slate-900 text-sm">Simulate User Role</h3>
                         <p className="text-xs text-slate-500 mt-0.5">Switch roles to test the dashboard permissions.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(['Admin', 'Manager', 'Sales', 'Viewer'] as UserRole[]).map(role => (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                userRole === role 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-[32px] p-8 flex flex-col items-center text-center relative sticky top-6 border border-slate-200 shadow-xl shadow-slate-200/40">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition shadow-sm border border-slate-100 hover:bg-white"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    <div className="w-32 h-32 rounded-full border-[6px] border-slate-50 shadow-2xl shadow-slate-200 mb-6 overflow-hidden relative group cursor-pointer mt-4">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Profile" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                        {isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white font-bold text-xs animate-in fade-in">Change</div>
                        )}
                    </div>
                    
                    {isEditing ? (
                        <div className="w-full space-y-3 mb-6">
                             <input 
                                type="text" 
                                value={profileData.name} 
                                onChange={e => handleChange('name', e.target.value)}
                                className="w-full text-center text-xl font-bold bg-slate-50 border border-transparent rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition tracking-tight"
                            />
                            <input 
                                type="text" 
                                value={profileData.role} 
                                onChange={e => handleChange('role', e.target.value)}
                                className="w-full text-center text-sm font-semibold text-slate-500 bg-slate-50 border border-transparent rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                            />
                        </div>
                    ) : (
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{profileData.name}</h3>
                            <p className="text-slate-500 font-semibold mt-1.5 text-sm">{profileData.role}</p>
                        </div>
                    )}

                    <div className="flex gap-3 mb-8 w-full justify-center">
                        <button className="p-3 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 hover:shadow-md hover:bg-white hover:scale-110 transition text-slate-600 group"><Sparkles className="w-5 h-5 group-hover:text-yellow-500 transition-colors" /></button>
                        <button className="p-3 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 hover:shadow-md hover:bg-white hover:scale-110 transition text-slate-600 group"><Mail className="w-5 h-5 group-hover:text-blue-500 transition-colors" /></button>
                        <button className="p-3 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 hover:shadow-md hover:bg-white hover:scale-110 transition text-slate-600 group"><Phone className="w-5 h-5 group-hover:text-green-500 transition-colors" /></button>
                    </div>

                    <div className="w-full text-left space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between group">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Role</p>
                                    <p className="font-bold text-slate-900 text-sm">{userRole}</p>
                                </div>
                            </div>
                             <div className="h-px bg-slate-200 w-full"></div>
                            <div className="flex items-center justify-between group">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Location</p>
                                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Nairobi, Kenya</p>
                                </div>
                            </div>
                             <div className="h-px bg-slate-200 w-full"></div>
                            <div className="flex items-center justify-between group">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Member Since</p>
                                    <p className="font-bold text-slate-900 text-sm">October 2023</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button className="mt-6 text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-6 py-4 rounded-xl transition w-full justify-center border border-transparent hover:border-red-100 text-xs uppercase tracking-wide">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Detailed Settings & Info */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Contact Information */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
                    <div className="flex justify-between items-center mb-6">
                         <h4 className="font-bold text-xl text-slate-900 tracking-tight">Contact Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 transition hover:border-slate-200 group">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest group-hover:text-slate-600 transition-colors">Email Address</p>
                            {isEditing ? (
                                <input 
                                    type="email" 
                                    value={profileData.email} 
                                    onChange={e => handleChange('email', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-sm"
                                />
                            ) : (
                                <p className="font-bold text-base text-slate-900 break-all">{profileData.email}</p>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 transition hover:border-slate-200 group">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest group-hover:text-slate-600 transition-colors">Phone Number</p>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={profileData.phone} 
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-sm"
                                />
                            ) : (
                                <p className="font-bold text-base text-slate-900">{profileData.phone}</p>
                            )}
                        </div>
                         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 transition hover:border-slate-200 group">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest group-hover:text-slate-600 transition-colors">Office Address</p>
                             {isEditing ? (
                                <input 
                                    type="text" 
                                    value={profileData.address} 
                                    onChange={e => handleChange('address', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-sm"
                                />
                            ) : (
                                <p className="font-bold text-base text-slate-900">{profileData.address}</p>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 transition hover:border-slate-200 group">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest group-hover:text-slate-600 transition-colors">Website</p>
                             {isEditing ? (
                                <input 
                                    type="text" 
                                    value={profileData.website} 
                                    onChange={e => handleChange('website', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-sm"
                                />
                            ) : (
                                <p className="font-bold text-base text-slate-900">{profileData.website}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
                    <h4 className="font-bold text-xl text-slate-900 mb-6 tracking-tight">Account Settings</h4>
                    
                    <div className="space-y-4">
                        <button className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition group border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-base">Security & Password</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage 2FA and password settings</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-full border border-slate-100 group-hover:border-slate-200 shadow-sm">
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                            </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition group border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-base">Notifications</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Customize alerts</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-full border border-slate-100 group-hover:border-slate-200 shadow-sm">
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                            </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition group border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-base">Billing & Plans</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage subscriptions</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-full border border-slate-100 group-hover:border-slate-200 shadow-sm">
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;