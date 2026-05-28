import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Sparkles, 
  ChevronRight, AlertTriangle, ShieldAlert,
  ChevronDown, Search
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from '../i18n';

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  website?: string;
  phone?: string;
  location: string;
  relationshipScore: number;
  avatar?: string;
  interactions?: any[];
  personalNotes?: string;
  aiIcebreaker?: string;
  aiStrategicContext?: string;
  aiSentiment?: string;
}

interface Node {
  id: string;
  contact: Contact;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Link {
  source: string;
  target: string;
}

// Relationship cooling status calculator
export const getCoolingStatus = (contact: Contact) => {
  const lastInteractionDate = contact.interactions && contact.interactions.length > 0
    ? parseISO(contact.interactions[0].date)
    : null;

  if (!lastInteractionDate) {
    return { status: 'critical', days: 99, label: 'Sin interacciones registradas' };
  }

  const diffTime = Math.abs(new Date().getTime() - lastInteractionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 60) {
    return { status: 'critical', days: diffDays, label: `Enfriamiento Crítico: ${diffDays} días inactivo` };
  } else if (diffDays >= 30) {
    return { status: 'warning', days: diffDays, label: `Inactivo: ${diffDays} días` };
  }

  return { status: 'healthy', days: diffDays, label: `Activo: Hace ${formatDistanceToNow(lastInteractionDate, { locale: es })}` };
};

interface NetworkMapViewProps {
  appContacts: Contact[];
  onExpandContact: (contact: Contact) => void;
}

export const NetworkMapView: React.FC<NetworkMapViewProps> = ({ appContacts, onExpandContact }) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Navigation and physics spread states
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [repulsionMultiplier, setRepulsionMultiplier] = useState(1.0);
  const [hasSelectedPattern, setHasSelectedPattern] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [filterCompany, setFilterCompany] = useState('all');

  // List of unique companies for dropdown filter
  const allCompanies = Array.from(new Set(appContacts.map(c => c.company).filter(Boolean))).sort();

  // Get filtered contacts list for simulation
  const filteredContacts = appContacts.filter(contact => {
    // 1. Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = contact.name.toLowerCase().includes(q);
      const matchesRole = contact.role.toLowerCase().includes(q);
      const matchesCompany = contact.company.toLowerCase().includes(q);
      if (!matchesName && !matchesRole && !matchesCompany) return false;
    }

    // 2. Company Filter
    if (filterCompany !== 'all' && contact.company !== filterCompany) {
      return false;
    }

    // 3. Status Filter
    if (filterStatus !== 'all') {
      const cooling = getCoolingStatus(contact);
      if (cooling.status !== filterStatus) return false;
    }

    return true;
  });

  // Update canvas size on resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 600),
          height: Math.max(rect.height, 500)
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up custom scroll wheel zoom listener to avoid passive listener warning and scroll block issues
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = svgEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomIntensity = 0.05;
      const wheel = e.deltaY < 0 ? 1 : -1;
      const zoomFactor = Math.exp(wheel * zoomIntensity);

      setZoomScale(prevZoom => {
        const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.3), 3.0);
        
        setPanOffset(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom)
        }));
        
        return nextZoom;
      });
    };

    svgEl.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Initialize nodes and run light physics simulation based on filtered contacts
  useEffect(() => {
    if (filteredContacts.length === 0) {
      setNodes([]);
      setSelectedContact(null);
      return;
    }

    const width = dimensions.width;
    const height = dimensions.height;

    // Set initial coordinates in circles by company
    const companies = Array.from(new Set(filteredContacts.map(c => c.company || 'Otros')));
    const companyCenters = new Map<string, { x: number; y: number }>();
    
    companies.forEach((company, index) => {
      const angle = (index / companies.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.28;
      companyCenters.set(company, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius
      });
    });

    // Create node objects
    const initialNodes: Node[] = filteredContacts.map((contact) => {
      const center = companyCenters.get(contact.company || 'Otros') || { x: width / 2, y: height / 2 };
      // Spread nodes slightly around company center
      const spreadAngle = Math.random() * 2 * Math.PI;
      const spreadRadius = Math.random() * 40;

      return {
        id: contact.id,
        contact,
        x: center.x + Math.cos(spreadAngle) * spreadRadius,
        y: center.y + Math.sin(spreadAngle) * spreadRadius,
        vx: 0,
        vy: 0,
        radius: 24 + (contact.relationshipScore / 100) * 12 // Node size proportional to score
      };
    });

    setNodes(initialNodes);

    // Auto-select first contact if none selected or if selected contact was filtered out
    if (initialNodes.length > 0) {
      const stillExists = initialNodes.some(n => n.id === selectedContact?.id);
      if (!stillExists) {
        setSelectedContact(initialNodes[0].contact);
      }
    } else {
      setSelectedContact(null);
    }
  }, [appContacts, searchQuery, filterStatus, filterCompany, dimensions.width, dimensions.height]);

  // Physics simulation loop (Spring force and Repulsion)
  useEffect(() => {
    if (nodes.length === 0) return;

    let animId: number;
    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const tick = () => {
      setNodes((prevNodes) => {
        // Calculate company centers of mass dynamically
        const companyCentroids = new Map<string, { x: number; y: number; count: number }>();
        prevNodes.forEach(node => {
          const company = node.contact.company || 'Otros';
          const current = companyCentroids.get(company) || { x: 0, y: 0, count: 0 };
          companyCentroids.set(company, {
            x: current.x + node.x,
            y: current.y + node.y,
            count: current.count + 1
          });
        });

        const companyCenters = new Map<string, { x: number; y: number }>();
        companyCentroids.forEach((val, key) => {
          companyCenters.set(key, { x: val.x / val.count, y: val.y / val.count });
        });

        // Copy nodes for physics calculation
        const updated = prevNodes.map(node => ({ ...node }));

        // 1. Apply forces
        for (let i = 0; i < updated.length; i++) {
          const n = updated[i];
          if (n.id === draggedNodeId) continue; // Skip dragged node

          // Pull to center (Gravity)
          const dxCenter = centerX - n.x;
          const dyCenter = centerY - n.y;
          n.vx += dxCenter * 0.0005;
          n.vy += dyCenter * 0.0005;

          // Pull to Company Cluster Center (Cohesion)
          const company = n.contact.company || 'Otros';
          const compCenter = companyCenters.get(company);
          if (compCenter) {
            const dxComp = compCenter.x - n.x;
            const dyComp = compCenter.y - n.y;
            n.vx += dxComp * 0.005;
            n.vy += dyComp * 0.005;
          }

          // Node-to-node repulsion
          for (let j = 0; j < updated.length; j++) {
            if (i === j) continue;
            const other = updated[j];
            const dx = n.x - other.x;
            const dy = n.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // Desired separation distance scaled by the repulsionMultiplier
            const minDist = (n.radius + other.radius + 35) * repulsionMultiplier;

            if (dist < minDist) {
              const force = (minDist - dist) * 0.04;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              n.vx += fx;
              n.vy += fy;
            }
          }
        }

        // 2. Update positions and apply friction
        updated.forEach(n => {
          if (n.id === draggedNodeId) return;

          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.85; // Damping
          n.vy *= 0.85;

          // Constrain within wider boundaries to allow more spreading space when zoom/pan is active
          n.x = Math.max(-width * 0.5, Math.min(width * 1.5, n.x));
          n.y = Math.max(-height * 0.5, Math.min(height * 1.5, n.y));
        });

        return updated;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [nodes.length, draggedNodeId, dimensions.width, dimensions.height, repulsionMultiplier]);

  // Dragging Handlers
  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedContact(node.contact);
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    // Start panning if clicked on the background or static elements
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect' || (e.target as SVGElement).tagName === 'circle') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNodeId) {
      // Convert screen coordinates to world coordinates by dividing by zoomScale and subtracting panOffset
      const worldX = (mouseX - panOffset.x) / zoomScale;
      const worldY = (mouseY - panOffset.y) / zoomScale;
      setNodes(prev => prev.map(node => {
        if (node.id === draggedNodeId) {
          return {
            ...node,
            x: worldX,
            y: worldY,
            vx: 0,
            vy: 0
          };
        }
        return node;
      }));
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUpOrLeave = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };



  // Group contacts to draw connections
  const companyLinks: Link[] = [];
  const nodesMap = new Map(nodes.map(n => [n.id, n]));

  // Connect nodes of the same company
  nodes.forEach((n1, i) => {
    if (!n1.contact.company || n1.contact.company === 'Otros') return;
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      if (n1.contact.company === n2.contact.company) {
        companyLinks.push({ source: n1.id, target: n2.id });
      }
    }
  });

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative select-none border border-white/5 bg-zinc-950/20 rounded-3xl backdrop-blur-3xl">
      {/* CSS Pulse animations for SVG nodes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-critical {
          0% { r: 24; opacity: 0.8; stroke-width: 1px; }
          50% { r: 35; opacity: 0.2; stroke-width: 2px; }
          100% { r: 24; opacity: 0; stroke-width: 1px; }
        }
        @keyframes pulse-warning {
          0% { r: 24; opacity: 0.7; stroke-width: 1px; }
          50% { r: 31; opacity: 0.3; stroke-width: 2px; }
          100% { r: 24; opacity: 0; stroke-width: 1px; }
        }
        .pulse-circle-critical {
          animation: pulse-critical 2s infinite ease-out;
        }
        .pulse-circle-warning {
          animation: pulse-warning 2.5s infinite ease-out;
        }
      ` }} />

      {/* SVG Canvas Map area */}
      <div className="flex-1 h-2/3 lg:h-full relative overflow-hidden bg-black/40">
        
        {/* Floating Toolbar (Search & Filters) */}
        <div className="absolute top-6 left-6 right-6 z-10 flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar contacto..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!hasSelectedPattern && e.target.value.trim() !== '') {
                  setHasSelectedPattern(true);
                }
              }}
              className="w-full bg-zinc-950/85 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 backdrop-blur-md shadow-2xl transition-all"
            />
          </div>

          {/* Company Selector Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              value={filterCompany}
              onChange={(e) => {
                setFilterCompany(e.target.value);
                if (!hasSelectedPattern) setHasSelectedPattern(true);
              }}
              className="w-full bg-zinc-950/85 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-primary/50 backdrop-blur-md shadow-2xl appearance-none cursor-pointer"
            >
              <option value="all">Todas las empresas</option>
              {allCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
              <ChevronDown size={12} />
            </div>
          </div>
          
          {/* Status Pills */}
          <div className="flex gap-1 bg-zinc-950/85 border border-white/10 p-1 rounded-xl backdrop-blur-md shadow-2xl">
            {(['all', 'healthy', 'warning', 'critical'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  if (!hasSelectedPattern) setHasSelectedPattern(true);
                }}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status 
                    ? 'bg-primary text-white shadow-[0_0_8px_rgba(249,17,23,0.5)]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'healthy' ? 'Activo' : status === 'warning' ? 'Inactivo' : 'Crítico'}
              </button>
            ))}
          </div>

          {/* Reset Pattern Button */}
          {hasSelectedPattern && (
            <button 
              onClick={() => setHasSelectedPattern(false)}
              className="bg-zinc-950/85 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xl flex items-center gap-1.5 shrink-0"
              title="Cambiar patrón de inicio"
            >
              <Sparkles size={12} className="text-primary" />
              <span>Patrón</span>
            </button>
          )}
        </div>

        {hasSelectedPattern ? (
          <>
            {/* Floating Zoom & Pan Controls */}
            <div className="absolute right-6 bottom-6 bg-zinc-950/85 border border-white/10 p-1.5 rounded-xl flex flex-col gap-1.5 backdrop-blur-md z-10 shadow-2xl">
              <button 
                onClick={() => {
                  setZoomScale(prev => Math.min(prev + 0.15, 3.0));
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black text-sm flex items-center justify-center transition-colors"
                title="Acercar (Zoom In)"
              >
                +
              </button>
              <button 
                onClick={() => {
                  setZoomScale(prev => Math.max(prev - 0.15, 0.3));
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black text-sm flex items-center justify-center transition-colors"
                title="Alejar (Zoom Out)"
              >
                -
              </button>
              <button 
                onClick={() => {
                  setZoomScale(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 py-1 text-[8px] rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-black uppercase tracking-widest transition-colors font-mono"
                title="Resetear Vista"
              >
                100%
              </button>
            </div>

            <svg 
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              {/* Grid Background Pattern */}
              <defs>
                <pattern id="network-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                </pattern>
                <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(212,119,44,0.04)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
                <filter id="shadow-neon">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#d4772c" floodOpacity="0.4" />
                </filter>
                <filter id="shadow-critical">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f91117" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Immersive background layers inside SVG */}
              <rect id="network-grid-bg" width="100%" height="100%" fill="url(#network-grid)" />
              <circle cx={dimensions.width/2} cy={dimensions.height/2} r={Math.min(dimensions.width, dimensions.height)*0.4} fill="url(#map-glow)" />

              {/* Transforming viewport group */}
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
                {/* Company Connection Lines */}
                <g>
                  {companyLinks.map((link, index) => {
                    const sourceNode = nodesMap.get(link.source);
                    const targetNode = nodesMap.get(link.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                      <line
                        key={index}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="rgba(212, 119, 44, 0.08)"
                        strokeWidth="1.5"
                        strokeDasharray="4, 4"
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </g>

                {/* Group and Nodes rendering */}
                <g>
                  {nodes.map((node) => {
                    const isSelected = selectedContact?.id === node.id;
                    const cooling = getCoolingStatus(node.contact);

                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        className="transition-transform duration-75"
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                        onClick={() => setSelectedContact(node.contact)}
                      >
                        {/* Glowing warning/critical pulse outer ring */}
                        {cooling.status === 'critical' && (
                          <circle
                            r={node.radius + 6}
                            fill="none"
                            stroke="#f91117"
                            className="pulse-circle-critical"
                          />
                        )}
                        {cooling.status === 'warning' && (
                          <circle
                            r={node.radius + 5}
                            fill="none"
                            stroke="#d4772c"
                            className="pulse-circle-warning"
                          />
                        )}

                        {/* Highlight Ring for Selection */}
                        {isSelected && (
                          <circle
                            r={node.radius + 4}
                            fill="none"
                            stroke={node.contact.relationshipScore > 75 ? '#10b981' : '#d4772c'}
                            strokeWidth="2"
                            filter="url(#shadow-neon)"
                          />
                        )}

                        {/* Core Node Circle */}
                        <circle
                          r={node.radius}
                          fill={cooling.status === 'critical' ? '#1c0a0c' : '#0c0c0e'}
                          stroke={
                            isSelected
                              ? (node.contact.relationshipScore > 75 ? '#10b981' : '#d4772c')
                              : (cooling.status === 'critical' 
                                  ? '#f91117' 
                                  : cooling.status === 'warning' 
                                    ? '#d4772c' 
                                    : 'rgba(255,255,255,0.08)')
                          }
                          strokeWidth="1.5"
                          className="transition-all hover:scale-105 duration-300 cursor-pointer"
                        />

                        {/* Initials Text */}
                        <text
                          dy=".3em"
                          textAnchor="middle"
                          fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                          fontSize={node.radius > 26 ? '11px' : '9px'}
                          fontWeight="900"
                          className="pointer-events-none uppercase tracking-tighter"
                        >
                          {node.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </text>

                        {/* Floating company tag when hovered or selected */}
                        {isSelected && node.contact.company && (
                          <g transform={`translate(0, ${node.radius + 16})`}>
                            <rect
                              x="-40"
                              y="-7"
                              width="80"
                              height="14"
                              rx="4"
                              fill="rgba(0,0,0,0.85)"
                              stroke="rgba(212,119,44,0.3)"
                              strokeWidth="0.5"
                            />
                            <text
                              textAnchor="middle"
                              fill="#d4772c"
                              fontSize="8px"
                              fontWeight="bold"
                              dy="3"
                              className="uppercase tracking-widest font-mono"
                            >
                              {node.contact.company.substring(0, 12)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>

            {/* Floating Legends & Dispersion Slider */}
            <div className="absolute bottom-6 left-6 bg-zinc-950/85 border border-white/5 p-4 rounded-2xl flex flex-col gap-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono backdrop-blur-md z-10 shadow-2xl min-w-[160px]">
              <span className="text-white border-b border-white/5 pb-1 mb-1 font-bold">Estado Relacional</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                <span className="text-zinc-400">Activo (&lt; 30 días)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50 animate-pulse" />
                <span className="text-zinc-400">Inactivo (&gt; 30 días)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600/30 border border-red-500 animate-pulse" />
                <span className="text-zinc-400">Enfriamiento Crítico (&gt; 60 días)</span>
              </div>
              
              <div className="border-t border-white/10 pt-2.5 mt-1 space-y-1.5 text-left">
                <span className="text-white font-bold block">Dispersión del Mapa</span>
                <input 
                  type="range" 
                  min="0.6" 
                  max="2.2" 
                  step="0.1" 
                  value={repulsionMultiplier}
                  onChange={(e) => setRepulsionMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-primary bg-zinc-800 rounded-lg appearance-none h-1 cursor-pointer"
                />
                <div className="flex justify-between text-[7px] text-zinc-600 font-bold">
                  <span>Compacto</span>
                  <span>Separado</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Landing Choice Screen for Relational Pattern Selection */
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-zinc-950/20 backdrop-blur-sm z-0">
            <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                <Users size={32} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Mapa Relacional Inteligente</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para evitar la saturación visual, selecciona un patrón de relacionamiento o filtro inicial para graficar las conexiones de tu red.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button 
                  onClick={() => {
                    setFilterStatus('critical');
                    setHasSelectedPattern(true);
                  }}
                  className="w-full bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 text-left px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs text-zinc-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#f91117]" />
                    <span className="font-bold">Contactos en Enfriamiento Crítico</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-primary transition-colors" />
                </button>

                <button 
                  onClick={() => {
                    setFilterStatus('healthy');
                    setHasSelectedPattern(true);
                  }}
                  className="w-full bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 text-left px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs text-zinc-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="font-bold">Contactos Activos (Conexión Frecuente)</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-primary transition-colors" />
                </button>

                <div className="border-t border-white/5 my-2" />

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-left font-mono ml-1">Otras Opciones de Inicio</span>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterCompany('all');
                        setSearchQuery('');
                        setHasSelectedPattern(true);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all"
                    >
                      Ver Todo
                    </button>
                    
                    <button 
                      onClick={() => {
                        setHasSelectedPattern(true);
                        setTimeout(() => {
                          const searchEl = document.querySelector('input[placeholder="Buscar contacto..."]') as HTMLInputElement;
                          if (searchEl) searchEl.focus();
                        }, 100);
                      }}
                      className="flex-1 bg-primary text-white font-black text-[9px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(249,17,23,0.4)] hover:scale-105"
                    >
                      Buscar Primero
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Side: Quick intelligence detail panel */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-950/60 backdrop-blur-xl flex flex-col h-1/3 lg:h-full shrink-0 lg:rounded-r-3xl rounded-b-3xl lg:rounded-bl-none">
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div 
              key={selectedContact.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar justify-between"
            >
              {/* Profile card summary */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedContact.avatar ? (
                      <img src={selectedContact.avatar} alt={selectedContact.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-zinc-500">{selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-white leading-tight">{selectedContact.name}</h3>
                    <p className="text-xs text-copper-light font-bold uppercase tracking-wider font-mono mt-0.5">{selectedContact.role}</p>
                    <p className="text-[10px] text-zinc-500 font-semibold">{selectedContact.company}</p>
                  </div>
                </div>

                {/* Score and Cooling bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-left">
                    <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black block">Afinidad</span>
                    <span className="text-sm font-black text-white font-mono mt-0.5 block">{selectedContact.relationshipScore}%</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-left">
                    <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black block">Ubicación</span>
                    <span className="text-xs font-bold text-zinc-400 mt-1 block truncate flex items-center gap-1">
                      <MapPin size={10} /> {selectedContact.location || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Health tag */}
                {(() => {
                  const cooling = getCoolingStatus(selectedContact);
                  return (
                    <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-left ${
                      cooling.status === 'critical'
                        ? 'bg-red-500/5 border-red-500/20 text-red-400'
                        : cooling.status === 'warning'
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {cooling.status === 'critical' ? <ShieldAlert size={14} /> : cooling.status === 'warning' ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
                      <span className="font-bold">{cooling.label}</span>
                    </div>
                  );
                })()}

                {/* AI Icebreaker */}
                {selectedContact.aiIcebreaker ? (
                  <div className="bg-copper/5 border border-copper/20 p-4 rounded-2xl text-left space-y-1 shadow-[0_0_15px_rgba(212,119,44,0.03)]">
                    <span className="text-[8px] uppercase tracking-widest text-copper-light font-black flex items-center gap-1 font-mono">
                      <Sparkles size={10} /> Rompehielo IA Sugerido
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      "{selectedContact.aiIcebreaker}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-left text-zinc-500 italic text-[11px]">
                    {t('networkMap.noIcebreaker')}
                  </div>
                )}

                {/* Strategic context */}
                {selectedContact.aiStrategicContext && (
                  <div className="space-y-1 text-left">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black font-mono block">{t('networkMap.strategicContext')}</span>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-900/40 p-3.5 rounded-xl border border-white/5">
                      {selectedContact.aiStrategicContext}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => onExpandContact(selectedContact)}
                  className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 glow-red shadow-lg"
                >
                  {t('networkMap.viewDossier')}
                  <ChevronRight size={12} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-3">
              <Users size={32} className="opacity-10" />
              <p className="text-xs font-bold text-zinc-400">{t('networkMap.selectContact')}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-600 max-w-xs font-mono">{t('networkMap.instruction')}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
