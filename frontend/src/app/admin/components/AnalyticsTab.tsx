'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardStats } from './types';

interface AnalyticsTabProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function AnalyticsTab({ stats, loading }: AnalyticsTabProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-card border border-neutral-300/50 animate-pulse h-64"
          />
        ))}
      </div>
    );
  }

  const { charts } = stats;

  // Active revenue dataset
  const activeRevenueData =
    revenuePeriod === 'daily'
      ? charts.dailyRevenue.map((d) => ({ label: d.date, value: d.amount }))
      : revenuePeriod === 'weekly'
        ? charts.weeklyRevenue.map((w) => ({ label: w.week, value: w.amount }))
        : charts.monthlyRevenue.map((m) => ({ label: m.month, value: m.amount }));

  // Find max value for scaling Area/Line Chart
  const maxRevenueVal = Math.max(...activeRevenueData.map((d) => d.value), 1);
  const chartHeight = 140;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  // Generate path coordinates for line chart
  const points = activeRevenueData.map((item, idx) => {
    const x = paddingX + (idx / (activeRevenueData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (item.value / maxRevenueVal) * (chartHeight - paddingY * 2);
    return { x, y, label: item.label, val: item.value };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : '';

  // Peak Order Hours Bar Chart Calculations
  const maxHourCount = Math.max(...charts.peakOrderHours.map((h) => h.count), 1);
  const barChartHeight = 140;
  const barChartWidth = 500;

  // Orders by Category Donut Calculations
  const categoryTotal = charts.ordersByCategory.reduce((sum, c) => sum + c.count, 0);
  let accumulatedAngle = 0;
  const donutColors = ['#E31837', '#FFC857', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics Console</h2>
          <p className="text-xs text-foreground mt-1">
            Gourmet sales distribution, category volume, and order hourly frequency audits.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-background border border-neutral-300/50 p-1 rounded-xl text-xs font-bold text-foreground">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setRevenuePeriod(period)}
              className={`px-4 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${revenuePeriod === period ? 'bg-red-600/10 text-red-500' : 'hover:text-primary'
                }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Performance Area Chart */}
        <div className="p-6 rounded-3xl bg-card border border-neutral-300/50 shadow-sm space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
            Revenue Performance (INR)
          </span>

          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#1f1f1f"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#1f1f1f"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#1f1f1f"
              />

              {/* Area Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E31837" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E31837" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Area path */}
              {areaPath && (
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  d={areaPath}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Line path */}
              {linePath && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={linePath}
                  fill="none"
                  stroke="#E31837"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Dots and Labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#000" stroke="#E31837" strokeWidth="2" />
                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    fill="#666"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                  <text
                    x={p.x}
                    y={p.y - 8}
                    fill="#fff"
                    fontSize="8"
                    fontWeight="extrabold"
                    textAnchor="middle"
                  >
                    ₹{p.val >= 1000 ? `${(p.val / 1000).toFixed(1)}k` : p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Peak Order Hours Bar Chart */}
        <div className="p-6 rounded-3xl bg-card border border-neutral-300/50 shadow-sm space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
            Hourly Order Load (Peak Hours)
          </span>

          <div className="relative">
            <svg
              viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {charts.peakOrderHours.map((item, idx) => {
                const count = item.count;
                const colWidth = (barChartWidth - paddingX * 2) / charts.peakOrderHours.length;
                const x = paddingX + idx * colWidth + colWidth * 0.15;
                const barW = colWidth * 0.7;
                const barH = (count / maxHourCount) * (barChartHeight - paddingY * 2);
                const y = barChartHeight - paddingY - barH;

                return (
                  <g key={idx}>
                    <motion.rect
                      initial={{ height: 0, y: barChartHeight - paddingY }}
                      animate={{ height: barH, y }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      fill="#E31837"
                      rx="4"
                      className="hover:fill-red-500 transition-colors"
                    />
                    <text
                      x={x + barW / 2}
                      y={barChartHeight - 4}
                      fill="#666"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.hour}
                    </text>
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      fill="#fff"
                      fontSize="8"
                      fontWeight="extrabold"
                      textAnchor="middle"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
              <line
                x1={paddingX}
                y1={barChartHeight - paddingY}
                x2={barChartWidth - paddingX}
                y2={barChartHeight - paddingY}
                stroke="#1f1f1f"
              />
            </svg>
          </div>
        </div>

        {/* Orders by Category Donut Chart */}
        <div className="p-6 rounded-3xl bg-card border border-neutral-300/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-4 w-full">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Orders By Category Share
            </span>
            <div className="space-y-2.5">
              {charts.ordersByCategory.map((c, idx) => {
                const percent = categoryTotal > 0 ? Math.round((c.count / categoryTotal) * 100) : 0;
                const color = donutColors[idx % donutColors.length];
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-bold text-foreground capitalize">
                        {c.category.toLowerCase()}
                      </span>
                    </div>
                    <span className="font-extrabold text-foreground">
                      {percent}% ({c.count} items)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut SVG */}
          <div className="relative shrink-0 flex items-center justify-center h-40 w-40">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {charts.ordersByCategory.map((c, idx) => {
                const percent = categoryTotal > 0 ? (c.count / categoryTotal) * 100 : 0;
                const strokeDash = `${percent} ${100 - percent}`;
                const strokeOffset = 100 - accumulatedAngle;
                accumulatedAngle += percent;
                const color = donutColors[idx % donutColors.length];

                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={strokeOffset}
                    pathLength="100"
                  />
                );
              })}
              {/* Inner Hole for Donut */}
              <circle cx="50" cy="50" r="29" fill="#121212" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold text-foreground uppercase tracking-widest">
                Total
              </span>
              <span className="text-xl font-black text-foreground">{categoryTotal}</span>
            </div>
          </div>
        </div>

        {/* Top Product / Customers Leaderboard */}
        <div className="p-6 rounded-3xl bg-card border border-neutral-300/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Top Selling Pizzas
            </span>
            <div className="space-y-3">
              {charts.topSellingPizza.map((p, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{p.name}</span>
                    <span>{p.count} sold</span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((p.count / 50) * 100, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-red-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground block">
              Top Customer Spends
            </span>
            <div className="space-y-3">
              {charts.topCustomers.map((c, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl bg-background border border-neutral-300/50/60"
                >
                  <div>
                    <span className="text-foreground block">{c.name}</span>
                    <span className="text-[10px] text-foreground">{c.orders} orders placed</span>
                  </div>
                  <span className="text-red-500 text-sm font-extrabold">
                    ₹{c.spend.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
