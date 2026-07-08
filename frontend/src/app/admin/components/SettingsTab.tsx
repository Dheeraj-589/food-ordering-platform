'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

export default function SettingsTab() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  const [deliveryFee, setDeliveryFee] = useState('');
  const [gstRate, setGstRate] = useState('');

  const [businessOpen, setBusinessOpen] = useState('');
  const [businessClose, setBusinessClose] = useState('');
  const [businessDays, setBusinessDays] = useState('');

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);

  const [payCash, setPayCash] = useState(true);
  const [payOnline, setPayOnline] = useState(true);
  const [payGateway, setPayGateway] = useState('DemoPay');

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      const data = response.data;

      if (data.store_details) {
        const store = JSON.parse(data.store_details);
        setStoreName(store.name || '');
        setStoreEmail(store.email || '');
        setStorePhone(store.phone || '');
        setStoreAddress(store.address || '');
      }

      if (data.delivery_charges) {
        setDeliveryFee(data.delivery_charges);
      }

      if (data.gst_rate) {
        setGstRate(data.gst_rate);
      }

      if (data.business_hours) {
        const hours = JSON.parse(data.business_hours);
        setBusinessOpen(hours.open || '');
        setBusinessClose(hours.close || '');
        setBusinessDays(hours.days || '');
      }

      if (data.smtp_settings) {
        const smtp = JSON.parse(data.smtp_settings);
        setSmtpHost(smtp.host || '');
        setSmtpPort(Number(smtp.port || 587));
      }

      if (data.payment_settings) {
        const pay = JSON.parse(data.payment_settings);
        setPayCash(pay.enableCash ?? true);
        setPayOnline(pay.enableOnline ?? true);
        setPayGateway(pay.defaultGateway || 'DemoPay');
      }
    } catch (err) {
      console.error(err);
      addToast('Could not load settings configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveItem = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await api.patch('/admin/settings', { key, value });
      addToast(`Configuration block "${key}" successfully saved!`, 'success');
      fetchSettings();
    } catch (err) {
      console.error(err);
      addToast('Failed to save settings block.', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveStore = () => {
    const value = JSON.stringify({
      name: storeName.trim(),
      email: storeEmail.trim(),
      phone: storePhone.trim(),
      address: storeAddress.trim(),
    });
    handleSaveItem('store_details', value);
  };

  const handleSaveBusiness = () => {
    const value = JSON.stringify({
      open: businessOpen.trim(),
      close: businessClose.trim(),
      days: businessDays.trim(),
    });
    handleSaveItem('business_hours', value);
  };

  const handleSaveSmtp = () => {
    const value = JSON.stringify({
      host: smtpHost.trim(),
      port: Number(smtpPort),
    });
    handleSaveItem('smtp_settings', value);
  };

  const handleSavePayments = () => {
    const value = JSON.stringify({
      enableCash: payCash,
      enableOnline: payOnline,
      defaultGateway: payGateway.trim(),
    });
    handleSaveItem('payment_settings', value);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-foreground font-bold">
        Loading store settings panel...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-red-500" /> Store Configurations
        </h2>
        <p className="text-xs text-foreground mt-1">
          Configure business operating timings, delivery fees, GST tax brackets, and mail protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold text-foreground">
        {/* Store Profile */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Store Profile Details
            </span>
            <button
              onClick={handleSaveStore}
              disabled={savingKey === 'store_details'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'store_details' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Details</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Business Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Contact Email
              </label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Contact Phone
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Corporate HQ Address
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Timings */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Business Timings
            </span>
            <button
              onClick={handleSaveBusiness}
              disabled={savingKey === 'business_hours'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'business_hours' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Hours</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Open Timing
              </label>
              <input
                type="text"
                value={businessOpen}
                onChange={(e) => setBusinessOpen(e.target.value)}
                placeholder="11:00 AM"
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Close Timing
              </label>
              <input
                type="text"
                value={businessClose}
                onChange={(e) => setBusinessClose(e.target.value)}
                placeholder="11:00 PM"
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
              Operating Days
            </label>
            <input
              type="text"
              value={businessDays}
              onChange={(e) => setBusinessDays(e.target.value)}
              placeholder="Monday - Sunday"
              className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
            />
          </div>
        </div>

        {/* Charges GST */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Margins, Fees & Taxes
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                  Flat Delivery Fee (INR)
                </label>
                <button
                  onClick={() => handleSaveItem('delivery_charges', deliveryFee)}
                  disabled={savingKey === 'delivery_charges'}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                >
                  Save
                </button>
              </div>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                  GST Rate (%)
                </label>
                <button
                  onClick={() => handleSaveItem('gst_rate', gstRate)}
                  disabled={savingKey === 'gst_rate'}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                >
                  Save
                </button>
              </div>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>
        </div>

        {/* SMTP Mail settings */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              SMTP Mail Server Configs
            </span>
            <button
              onClick={handleSaveSmtp}
              disabled={savingKey === 'smtp_settings'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'smtp_settings' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save SMTP</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                SMTP Mail Host
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Payment options */}
        <div className="p-6 bg-card border border-neutral-300/50 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-neutral-950 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Payment Options & Gateways
            </span>
            <button
              onClick={handleSavePayments}
              disabled={savingKey === 'payment_settings'}
              className="px-3.5 py-1.5 rounded-xl bg-red-650/10 border border-red-500/20 hover:bg-red-950/20 text-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {savingKey === 'payment_settings' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Gateways</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Cash On Delivery
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="pay-cod-option"
                  checked={payCash}
                  onChange={(e) => setPayCash(e.target.checked)}
                  className="h-4.5 w-4.5 accent-red-600 rounded bg-background border border-neutral-300/50 cursor-pointer"
                />
                <label
                  htmlFor="pay-cod-option"
                  className="text-foreground select-none cursor-pointer"
                >
                  Enable COD Payment
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Card / UPI Online
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="pay-online-option"
                  checked={payOnline}
                  onChange={(e) => setPayOnline(e.target.checked)}
                  className="h-4.5 w-4.5 accent-red-600 rounded bg-background border border-neutral-300/50 cursor-pointer"
                />
                <label
                  htmlFor="pay-online-option"
                  className="text-foreground select-none cursor-pointer"
                >
                  Enable Online Payment
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                Default Demo Gateway
              </label>
              <input
                type="text"
                value={payGateway}
                onChange={(e) => setPayGateway(e.target.value)}
                className="w-full bg-background border border-neutral-800 rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-red-500/50 font-sans"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
