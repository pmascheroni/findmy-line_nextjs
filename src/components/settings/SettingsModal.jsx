import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings, ALL_SPORTSBOOKS, ALL_PREDICTION_MARKETS, VIEW_MODE_BOOKS, VIEW_MODE_MARKETS } from "./SettingsContext";
import { Trash2, Plus, Search, X, ArrowLeftRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SettingsModal({ open, onOpenChange, initialTab = "books" }) {
  const { 
    selectedSportsbooks, addSportsbook, removeSportsbook, replaceSportsbook,
    selectedPredictionMarkets, addPredictionMarket, removePredictionMarket, replacePredictionMarket,
    viewMode, setViewMode
  } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceMode, setReplaceMode] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Sync activeTab with initialTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  
  const isBooks = activeTab === "books";
  const allItems = isBooks ? ALL_SPORTSBOOKS : ALL_PREDICTION_MARKETS;
  const selectedItems = isBooks ? selectedSportsbooks : selectedPredictionMarkets;
  const addItem = isBooks ? addSportsbook : addPredictionMarket;
  const removeItem = isBooks ? removeSportsbook : removePredictionMarket;
  const replaceItem = isBooks ? replaceSportsbook : replacePredictionMarket;
  
  const selectedCount = selectedItems.length;
  const isFull = selectedCount >= 5;

  // Get selected items with full data
  const selectedData = selectedItems.map(key => 
    allItems.find(item => item.key === key)
  ).filter(Boolean);

  // Filter available items (not selected)
  const availableItems = allItems.filter(item => 
    !selectedItems.includes(item.key) &&
    (searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group available items by region
  const groupedItems = availableItems.reduce((acc, item) => {
    if (!acc[item.region]) acc[item.region] = [];
    acc[item.region].push(item);
    return acc;
  }, {});

  const handleAddItem = (key) => {
    if (isFull) {
      setReplaceMode(key);
    } else {
      addItem(key);
    }
  };

  const handleReplace = (oldKey) => {
    if (replaceMode) {
      replaceItem(oldKey, replaceMode);
      setReplaceMode(null);
    }
  };

  const handleClose = () => {
    setReplaceMode(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setReplaceMode(null);
    setSearchQuery("");
    // Also update the global view mode
    setViewMode(tab === "books" ? VIEW_MODE_BOOKS : VIEW_MODE_MARKETS);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-tour="settings-content" className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[85vh] flex flex-col z-[105]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>
        
        {/* Tab Toggle */}
        <div className="flex bg-slate-800 rounded-lg p-1 mb-4">
          <button
            onClick={() => handleTabChange("books")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "books" 
                ? "bg-blue-500 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sportsbooks
          </button>
          <button
            onClick={() => handleTabChange("markets")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "markets" 
                ? "bg-purple-500 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Prediction Markets
          </button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Replace Mode Banner */}
          {replaceMode && (
            <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-300">
                    Select which to replace with <strong>{allItems.find(b => b.key === replaceMode)?.name}</strong>
                  </span>
                </div>
                <button onClick={() => setReplaceMode(null)} className="text-orange-400 hover:text-orange-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Selected Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                Your {isBooks ? "Sportsbooks" : "Prediction Markets"} ({selectedCount}/5)
              </span>
            </div>
            
            <div className="space-y-2">
              {selectedData.map(item => (
                <div 
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    replaceMode 
                      ? 'bg-orange-500/10 border-orange-500/50 cursor-pointer hover:bg-orange-500/20' 
                      : isBooks ? 'bg-blue-500/10 border-blue-500/50' : 'bg-purple-500/10 border-purple-500/50'
                  }`}
                  onClick={() => replaceMode && handleReplace(item.key)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isBooks ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {item.short}
                    </div>
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{item.region}</span>
                    </div>
                  </div>
                  
                  {!replaceMode && (
                    <button
                      onClick={() => removeItem(item.key)}
                      disabled={selectedCount <= 1}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedCount <= 1 
                          ? 'text-slate-600 cursor-not-allowed' 
                          : 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {replaceMode && (
                    <span className="text-xs text-orange-400">Click to replace</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 my-2" />

          {/* Add Section */}
          {!replaceMode && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">
                  Add {isBooks ? "Sportsbook" : "Prediction Market"}
                </span>
                {isFull && (
                  <span className="text-xs text-orange-400">Max reached - selecting will replace</span>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder={`Search ${isBooks ? "sportsbooks" : "prediction markets"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Available Items List */}
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-4 pb-2">
                  {Object.entries(groupedItems).map(([region, items]) => (
                    <div key={region}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {region}
                      </div>
                      <div className="space-y-1">
                        {items.map(item => (
                          <button
                            key={item.key}
                            onClick={() => handleAddItem(item.key)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-700 text-slate-300">
                              {item.short}
                            </div>
                            <span className="text-sm text-slate-300">{item.name}</span>
                            <Plus className="w-4 h-4 text-slate-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {availableItems.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      {searchQuery ? `No ${isBooks ? "sportsbooks" : "prediction markets"} match your search` : `All ${isBooks ? "sportsbooks" : "prediction markets"} selected`}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}