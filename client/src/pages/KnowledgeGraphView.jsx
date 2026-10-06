import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  Filter, 
  Compass, 
  Brain, 
  Layers, 
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../api';

export function KnowledgeGraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'SKILL', 'CAREER'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await api.getKnowledgeGraph();
      setGraphData(res);
      if (res.nodes && res.nodes.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = graphData.nodes.filter(node => {
    const matchesFilter = filterType === 'ALL' || node.type === filterType;
    const matchesSearch = !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Graph Explorer</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Graph Adjacency Network
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Directed Acyclic Graph (DAG) visualizing Career-to-Skill relationships and prerequisite dependency flows.
          </p>
        </div>

        {/* Search & Type Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
          >
            <option value="ALL">All Entities</option>
            <option value="SKILL">Skills Only</option>
            <option value="CAREER">Careers Only</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Visual Graph Grid */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 min-h-[550px] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Graph Vertices ({filteredNodes.length} Nodes)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {graphData.links.length} Directed Edges
              </span>
            </div>

            {/* Visual Node Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3">
              {filteredNodes.map(node => {
                const isSelected = selectedNode && selectedNode.id === node.id;
                const isCareer = node.type === 'CAREER';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-left ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-500/20'
                        : isCareer
                        ? 'border-sky-500/30 bg-sky-950/10 hover:border-sky-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isCareer ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {node.type}
                      </span>
                      {node.proficiency !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {node.proficiency}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{node.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{node.category}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Graph Legend */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-500/30 border border-sky-400" />
              <span>Target Careers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
              <span>Competency Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-slate-600 inline-block" />
              <span>Directed Prerequisite Edge (A → B)</span>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector Sidebar */}
        <div className="lg:col-span-4">
          {selectedNode ? (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Node Inspector: {selectedNode.type}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedNode.category}</p>
              </div>

              {/* Node Attributes */}
              <div className="space-y-2 text-xs">
                {selectedNode.proficiency !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Current Student Proficiency</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedNode.proficiency}%</span>
                  </div>
                )}
                {selectedNode.difficulty && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Complexity Difficulty</span>
                    <span className="font-semibold text-slate-200">{selectedNode.difficulty}</span>
                  </div>
                )}
                {selectedNode.marketDemand && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Market Demand Index</span>
                    <span className="font-semibold text-sky-400">{selectedNode.marketDemand}/100</span>
                  </div>
                )}
              </div>

              {/* Connected Inbound/Outbound Edges */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Connected Graph Dependencies:
                </span>

                {/* Direct prerequisites */}
                {graphData.links
                  .filter(l => l.target === selectedNode.id)
                  .map((l, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">Requires Prerequisite:</span>
                      <span className="font-bold text-indigo-400">{l.source}</span>
                    </div>
                  ))}

                {/* Direct downstream dependents */}
                {graphData.links
                  .filter(l => l.source === selectedNode.id)
                  .map((l, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">Required By:</span>
                      <span className="font-bold text-sky-400">{l.target.replace('career_', '')}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Select a node to inspect its adjacency matrix connections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
