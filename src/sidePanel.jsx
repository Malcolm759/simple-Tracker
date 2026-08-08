import React from 'react';
// This is for the side bar
const SidePanel = () => {
  return (
    <aside className="w-[280px] flex flex-col gap-6">
      
      {/* Settings Card */}
      <div className="bg-bg-card p-6 rounded-2xl border border-bg-border">
        <h3 className="text-lg font-medium mb-3">Settings</h3>
        <p className="text-sm text-text-muted mb-1">Network: <span className="text-text-active">Ethereum Mainnet</span></p>
        <p className="text-sm text-text-muted">Refresh Interval: <span className="text-text-active">10 seconds (Auto)</span></p>
      </div>
      
      {/* Tools & Resources Card */}
      <div className="bg-bg-card p-6 rounded-2xl border border-bg-border">
        <h3 className="text-lg font-medium mb-3">Tools & Resources</h3>
        <ul className="text-sm text-text-active space-y-1">
          <li>Viem Docs</li>
          <li>Wagmi Docs</li>
          <li>TanStack Query</li>
        </ul>
      </div>
      
    </aside>
  );
};

export default SidePanel;