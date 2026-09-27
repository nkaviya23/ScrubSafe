import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import HomeView from './components/HomeView.jsx';
import CheckRiskView from './components/CheckRiskView.jsx';
import ReportCaseView from './components/ReportCaseView.jsx';
import RiskMapView from './components/RiskMapView.jsx';
import CommunityRadarView from './components/CommunityRadarView.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('en'); // 'en' | 'ta'
  const [stats, setStats] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [prefilledSymptoms, setPrefilledSymptoms] = useState(null);

  const fetchData = async () => {
    try {
      // 1. Health check
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }

      // 2. Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }

      // 3. Community Risk Radar
      const radarRes = await fetch('/api/community-risk');
      if (radarRes.ok) {
        const radarJson = await radarRes.json();
        setRadarData(radarJson);
      }
    } catch (err) {
      console.warn('Backend connection issue:', err);
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePreFillReport = (symptoms) => {
    setPrefilledSymptoms(symptoms);
    setActiveTab('report');
  };

  const handleReportSuccess = (newReport) => {
    fetchData();
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        radarData={radarData}
        backendStatus={backendStatus}
        lang={lang}
        setLang={setLang}
      />

      <main className="main-content">
        {activeTab === 'home' && (
          <HomeView
            stats={stats}
            radarData={radarData}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'check-risk' && (
          <CheckRiskView
            onReportWithSymptoms={handlePreFillReport}
            lang={lang}
          />
        )}

        {activeTab === 'report' && (
          <ReportCaseView
            initialSymptoms={prefilledSymptoms}
            onReportSuccess={handleReportSuccess}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'map' && (
          <RiskMapView
            radarData={radarData}
            lang={lang}
          />
        )}

        {activeTab === 'radar' && (
          <CommunityRadarView
            radarData={radarData}
            onRefreshRadar={fetchData}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}
