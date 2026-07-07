'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, Info } from 'lucide-react';
import api from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

export default function CmsTab() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // CMS forms state variables
  const [announcementText, setAnnouncementText] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroBtnText, setHeroBtnText] = useState('');
  const [heroBtnLink, setHeroBtnLink] = useState('');

  const [footerAddress, setFooterAddress] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');

  const fetchCms = async () => {
    try {
      const response = await api.get('/admin/cms');
      const data = response.data;

      if (data.announcement_bar) {
        setAnnouncementText(data.announcement_bar);
      }

      if (data.hero_banner) {
        const hero = JSON.parse(data.hero_banner);
        setHeroTitle(hero.title || '');
        setHeroSubtitle(hero.subtitle || '');
        setHeroBtnText(hero.buttonText || '');
        setHeroBtnLink(hero.buttonLink || '');
      }

      if (data.footer_content) {
        const foot = JSON.parse(data.footer_content);
        setFooterAddress(foot.address || '');
        setFooterPhone(foot.phone || '');
        setFooterEmail(foot.email || '');
        setFooterCopyright(foot.copyright || '');
      }
    } catch (err) {
      console.error(err);
      addToast('Could not load CMS layout contents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCms();
  }, []);

  const handleSaveItem = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await api.patch('/admin/cms', { key, value });
      addToast(`Layout block "${key}" successfully saved!`, 'success');
      fetchCms();
    } catch (err) {
      console.error(err);
      addToast('Failed to save layout content block.', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveHero = () => {
    const value = JSON.stringify({
      title: heroTitle.trim(),
      subtitle: heroSubtitle.trim(),
      buttonText: heroBtnText.trim(),
      buttonLink: heroBtnLink.trim(),
    });
    handleSaveItem('hero_banner', value);
  };

  const handleSaveFooter = () => {
    const value = JSON.stringify({
      address: footerAddress.trim(),
      phone: footerPhone.trim(),
      email: footerEmail.trim(),
      copyright: footerCopyright.trim(),
    });
    handleSaveItem('footer_content', value);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-neutral-500 font-bold">
        Loading CMS configurations panel...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div>
        <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" /> Layout CMS Editor
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Configure announcement banners, homepage hero captions, buttons, and footer links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold text-neutral-400">
        {/* Banner Block */}
        <div className="p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block">
              Announcement Bar Banner
            </span>
            <button
              onClick={() => handleSaveItem('announcement_bar', announcementText)}
              disabled={savingKey === 'announcement_bar'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'announcement_bar' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Bar</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
              Header Marquee Text
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Announcements or deals running at store top..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
            />
          </div>
        </div>

        {/* Hero Slider settings */}
        <div className="p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block">
              Homepage Hero Section
            </span>
            <button
              onClick={handleSaveHero}
              disabled={savingKey === 'hero_banner'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'hero_banner' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Hero</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                Hero Section Title
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Title text banner..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                Hero Section Subtitle
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Subtitle paragraphs text..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={heroBtnText}
                  onChange={(e) => setHeroBtnText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Primary Link Path
                </label>
                <input
                  type="text"
                  value={heroBtnLink}
                  onChange={(e) => setHeroBtnLink(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer configurations */}
        <div className="p-6 bg-neutral-900 border border-neutral-850 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block">
              Footer Content Blocks
            </span>
            <button
              onClick={handleSaveFooter}
              disabled={savingKey === 'footer_content'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'footer_content' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Footer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Store Address
                </label>
                <input
                  type="text"
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={footerPhone}
                  onChange={(e) => setFooterPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Contact Email
                </label>
                <input
                  type="text"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                  Copyright Tagline
                </label>
                <input
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-red-500/50 font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
