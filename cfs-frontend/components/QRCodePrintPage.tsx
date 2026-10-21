/// <reference types="vite/client" />

import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { getEndpoints, FRONTEND_URL, API_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { FaPrint } from 'react-icons/fa';
import { SearchableSelect } from './SearchableSelect';
import catalystLogo from '../src/images/clogo.png';
import qrCardBg from '../src/images/cartimg.png';

interface SiteData {
  location: string;
  branch_location: string;
  canteens?: string[];
  logo?: string;
}

const toSlug = (name: string) => {
  return name.toLowerCase().replace(/[&]+/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

const getQRCodeUrl = (site: string, canteen?: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const base = `${protocol}//${host}`;

  if (canteen) {
    return `${base}/f/${toSlug(site)}/${toSlug(canteen)}`;
  }
  return `${base}/feedback?site=${encodeURIComponent(site)}`;
};

const QRCodePrintPage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const endpoints = getEndpoints();
  const [sites, setSites] = useState<SiteData[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('All Branches');
  const [modalData, setModalData] = useState<{ site: string, canteen?: string, title: string, logo?: string } | null>(null);

  // We'll use a dedicated print window to avoid issues with modal transforms
  // and browser print rendering that can produce blank pages. The handlers
  // below open a new window containing only the printable content and call
  // `print()` there.
  const printAreaRef = React.useRef<HTMLDivElement | null>(null);
  const printAllRef = React.useRef<HTMLDivElement | null>(null);

  // Shared styles for both preview and print
  const sharedStyles = `
    .qr-poster-container {
      width: 210mm;
      height: 297mm;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20mm;
      box-sizing: border-box;
      position: relative;
    }
    .qr-box-inner {
      padding: 30px;
      background: white;
      border-radius: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      border: 1px solid #eee;
      margin-bottom: 30px;
    }
    .url-pill-minimal {
      display: inline-block;
      padding: 15px 40px;
      border-radius: 12px;
      font-family: monospace;
      font-size: 16pt;
      color: #000;
      font-weight: 700;
      background: #f8f9fa;
      border: 2px solid #eee;
      word-break: break-all;
      max-width: 90%;
      text-align: center;
    }
    .scan-text-minimal {
      color: #666;
      font-family: sans-serif;
      font-size: 14pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 25px;
    }
  `;

  const handlePrintSingle = () => {
    const el = printAreaRef.current || document.getElementById('qr-print-area');
    if (!el) return;

    // Create print-specific styles (No more external 404s!)
    const printStyles = `
      <style>
        ${sharedStyles}
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          #print-container {
            width: 210mm;
            height: 297mm;
            position: relative;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        }
      </style>
    `;

    // Use an iframe for printing to avoid new window redirection
    let printFrame = document.getElementById('print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-frame';
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
    }

    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-print').forEach(b => b.remove());

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          ${printStyles}
        </head>
        <body>
          <div id="print-container">${clone.outerHTML}</div>
        </body>
      </html>
    `);
    doc.close();

    // Wait for content to load then print
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 500);
  };

  const handlePrintAll = () => {
    const el = printAllRef.current || document.getElementById('qr-print-all-area');
    if (!el) return;

    const printStyles = `
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .qr-page {
            page-break-after: always;
            page-break-inside: avoid;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .qr-page:last-child {
            page-break-after: avoid;
          }
          /* Ensure images and QR codes scale correctly */
          img, canvas, svg {
            max-height: 60vh !important;
            width: auto !important;
          }
          h3, p, span {
            margin: 10px 0 !important;
          }
        }
      </style>
    `;

    let printFrame = document.getElementById('print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-frame';
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    // We need to find all the individual QR card containers
    // They are nested inside the fragments
    const qrCards = el.querySelectorAll('.qr-collectible');
    let wrappedContent = '';

    qrCards.forEach(card => {
      wrappedContent += `<div class="qr-page">${card.innerHTML}</div>`;
    });

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print All QR Codes</title>
          ${printStyles}
          <link rel="stylesheet" href="/index.css">
        </head>
        <body>
          ${wrappedContent}
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      }
    };

    // Wait for images in the iframe to finish loading before opening print dialog
    const imgs = Array.from(doc.images);
    if (imgs.length === 0) {
      setTimeout(triggerPrint, 300);
    } else {
      let loaded = 0;
      let fired = false;
      const onDone = () => {
        if (!fired) {
          fired = true;
          triggerPrint();
        }
      };

      imgs.forEach(img => {
        if (img.complete) {
          loaded++;
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === imgs.length) onDone();
          };
          img.onerror = () => {
            loaded++;
            if (loaded === imgs.length) onDone();
          };
        }
      });

      if (loaded === imgs.length) {
        setTimeout(onDone, 200);
      } else {
        // Fallback timeout in case some images hang
        setTimeout(onDone, 1200);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('canteenAdminJWT') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const fetchData = async () => {
      try {
        const res = await fetch(endpoints.SITES, { headers });
        const data = await res.json();

        if (Array.isArray(data?.sites)) {
          let loadedSites: SiteData[] = data.sites;

          try {
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              if (payload?.role === 'branch_admin' && payload?.site) {
                loadedSites = loadedSites.filter(s => s.location === payload.site);
              }
            }
          } catch { }

          const sitesWithCanteens = await Promise.all(loadedSites.map(async (site) => {
            try {
              const cRes = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site.location)}`, { headers });
              const cData = await cRes.json();

              // Fetch branch logo
              let logo = '';
              try {
                const bRes = await fetch(`${endpoints.ADMIN_BRANCH_ADMINS}?site=${encodeURIComponent(site.location)}`, { headers });
                const bData = await bRes.json();
                if (bData.branch_admins && bData.branch_admins.length > 0 && bData.branch_admins[0].logo) {
                  logo = bData.branch_admins[0].logo;
                }
              } catch {}

              return { ...site, canteens: cData.canteens || [], logo };
            } catch {
              return { ...site, canteens: [] };
            }
          }));
          setSites(sitesWithCanteens);
        }
      } catch (e) {
        console.error(e);
        setSites([]);
      }
    };
    fetchData();
  }, []);

  const branchOptions = useMemo(() => {
    return [
      { value: 'All Branches', label: 'All Sites / Branches' },
      ...sites.map(site => ({ value: site.location, label: site.location }))
    ];
  }, [sites]);

  const filteredSites = sites.filter(
    site => selectedBranch === 'All Branches' || site.location === selectedBranch
  );

  const totalQRsCount = filteredSites.reduce((acc, s) => acc + (s.canteens?.length || 1), 0);
  const allQRsCount = sites.reduce((acc, s) => acc + (s.canteens?.length || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-4 mb-4 shadow-md flex items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-white">QR Codes Generator (Poster Layout)</h1>
            <p className="text-white/80 text-sm mt-1">Generated URLs use: <span className="font-mono bg-black/10 px-2 rounded">{window.location.origin}</span></p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4 no-print">
              <div className="text-white font-bold text-lg leading-none">
                {selectedBranch !== 'All Branches'
                  ? `${totalQRsCount} / ${allQRsCount}`
                  : totalQRsCount}
              </div>
              <div className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Total QRs</div>
            </div>
            <button
              onClick={handlePrintAll}
              className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition hover:scale-105 no-print"
            >
              <FaPrint /> Print All
            </button>
          </div>
        </div>

        {/* Network Warning */}
        {window.location.hostname === 'localhost' && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm no-print">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-800 font-bold text-sm">Localhost Detected</p>
                <p className="text-amber-700 text-xs mt-0.5">Mobile phones cannot scan "localhost" links. To create working QR codes, access this admin panel using your Computer's Network IP (e.g. <strong>http://192.168.x.x:5173</strong>).</p>
              </div>
            </div>
          </div>
        )}

        {/* Branch Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Filter by Branch / Site</label>
            <SearchableSelect
              options={branchOptions}
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val || 'All Branches')}
              placeholder="Select Branch / Site"
              clearable={false}
            />
          </div>

          <div className="sm:ml-auto text-xs font-bold text-gray-400 self-end mb-2">
            {selectedBranch !== 'All Branches'
              ? `Showing ${totalQRsCount} of ${allQRsCount} QRs`
              : `Total: ${totalQRsCount} QRs`}
          </div>
        </div>

        {/* Filtered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-print">
          {filteredSites.map((site) => (
              <React.Fragment key={site.location}>
                {(site.canteens && site.canteens.length > 0) ? (
                  site.canteens.map(canteen => (
                    <div key={`${site.location}-${canteen}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center hover:shadow-md transition">
                      <h3 className="font-bold text-gray-800 text-center mb-1">{site.location}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium mb-3">{canteen}</span>
                      <QRCode value={getQRCodeUrl(site.location, canteen)} size={140} />
                      <p className="text-xs text-gray-400 mt-4 font-mono break-all text-center px-2">{canteen}</p>
                      <div className="flex gap-2 mt-4 w-full">
                        <button
                          onClick={() => setModalData({ site: site.location, canteen, title: `${canteen}`, logo: site.logo })}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition"
                        >
                          Print QR
                        </button>
                        <button
                          onClick={() => window.open(getQRCodeUrl(site.location, canteen), '_blank')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition"
                        >
                          Open Form
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center hover:shadow-md transition">
                    <h3 className="font-bold text-gray-800 text-center mb-1">{site.location}</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium mb-3">Main Site</span>
                    <QRCode value={getQRCodeUrl(site.location)} size={140} />
                    <p className="text-xs text-gray-400 mt-4">{site.location}</p>
                    <div className="flex gap-2 mt-4 w-full">
                      <button
                        onClick={() => setModalData({ site: site.location, title: site.location, logo: site.logo })}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition"
                      >
                        Print QR
                      </button>
                      <button
                        onClick={() => window.open(getQRCodeUrl(site.location), '_blank')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition"
                      >
                        Open Form
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          {filteredSites.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
              No QR codes found matching your filters or search.
            </div>
          )}
        </div>
      </div>



      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden print:p-0 print:block print:overflow-visible">

          {/* Close Button - Outside scale wrapper for easy access on screen */}
          <button
            onClick={() => setModalData(null)}
            className="fixed top-6 right-6 text-white/80 hover:text-white z-[60] no-print p-2 transition-transform hover:rotate-90"
            title="Close Preview"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Scaled Preview Wrapper - Center properly */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden print:w-auto print:h-auto print:block">
            <style>{sharedStyles}</style>
            <div className="relative shadow-2xl bg-white transform-gpu scale-[0.30] sm:scale-[0.40] md:scale-[0.50] lg:scale-[0.55] xl:scale-[0.60] print:scale-100 print:transform-none transition-transform duration-300 origin-center">

              <div id="qr-print-area"
                className="qr-poster-container"
                ref={printAreaRef}
              >
                {/* Print Button (Hidden in Print) */}
                <button
                  onClick={handlePrintSingle}
                  className="absolute top-12 right-12 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black shadow-xl hover:scale-105 transition flex items-center gap-3 text-2xl border-4 border-white/20 no-print z-50 cursor-pointer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  PRINT CARD
                </button>

                {/* Top Header: Catalyst Logo (left) + Branch Logo (right) */}
                <div style={{ position: 'absolute', top: '15mm', left: '20mm', right: '20mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <img src={catalystLogo} alt="Catalyst" style={{ height: '45px', objectFit: 'contain' }} />
                  {modalData.logo && (
                    <img src={modalData.logo} alt="Branch Logo" style={{ height: '55px', objectFit: 'contain', maxWidth: '200px' }} />
                  )}
                </div>

                {/* Title */}
                <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '28pt', fontWeight: 900, color: '#1a1a1a', margin: '0', fontFamily: 'sans-serif' }}>We Value Your Feedback</h2>
                </div>

                <div className="qr-box-inner">
                  <QRCode value={getQRCodeUrl(modalData.site, modalData.canteen)} size={480} />
                </div>

                {/* Scan text */}
                <div className="scan-text-minimal" style={{ marginTop: '15px' }}>
                  Scan to provide feedback
                </div>

                {/* Website URL */}
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11pt', color: '#999', fontFamily: 'sans-serif', fontWeight: 500, margin: 0 }}>www.catalystsolutions.eco</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Print All Container - available for direct printing without modal overlay */}
      <div
        id="qr-print-all-area"
        ref={printAllRef}
        className="fixed -left-[99999px] top-0 pointer-events-none opacity-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-0">
          {filteredSites.map((site) => (
            <React.Fragment key={site.location}>
              {(site.canteens && site.canteens.length > 0) ? (
                site.canteens.map(canteen => (
                  <div key={`${site.location}-${canteen}`} className="qr-collectible flex flex-col items-center justify-center" style={{ position: 'relative' }}>
                    {/* Header logos */}
                    <div style={{ position: 'absolute', top: '15mm', left: '15mm', right: '15mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <img src={catalystLogo} alt="Catalyst" style={{ height: '35px', objectFit: 'contain' }} />
                      {site.logo && <img src={site.logo} alt="Branch Logo" style={{ height: '45px', objectFit: 'contain', maxWidth: '160px' }} />}
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 text-center mb-6">We Value Your Feedback</h3>
                    <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
                      <QRCode value={getQRCodeUrl(site.location, canteen)} size={280} />
                    </div>
                    <p className="text-gray-500 font-semibold text-xs mt-6 uppercase tracking-widest">Scan to provide feedback</p>
                    <p style={{ fontSize: '10pt', color: '#999', fontWeight: 500, marginTop: '10px' }}>www.catalystsolutions.eco</p>
                  </div>
                ))
              ) : (
                <div key={`${site.location}-main`} className="qr-collectible flex flex-col items-center justify-center" style={{ position: 'relative' }}>
                  {/* Header logos */}
                  <div style={{ position: 'absolute', top: '15mm', left: '15mm', right: '15mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <img src={catalystLogo} alt="Catalyst" style={{ height: '35px', objectFit: 'contain' }} />
                    {site.logo && <img src={site.logo} alt="Branch Logo" style={{ height: '45px', objectFit: 'contain', maxWidth: '160px' }} />}
                  </div>
                  <h3 className="font-bold text-2xl text-gray-800 text-center mb-6">We Value Your Feedback</h3>
                  <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
                    <QRCode value={getQRCodeUrl(site.location)} size={280} />
                  </div>
                  <p className="text-gray-500 font-semibold text-xs mt-6 uppercase tracking-widest">Scan to provide feedback</p>
                  <p style={{ fontSize: '10pt', color: '#999', fontWeight: 500, marginTop: '10px' }}>www.catalystsolutions.eco</p>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRCodePrintPage;
