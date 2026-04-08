import React, { useState, useCallback, useEffect } from 'react';
import { Wheel, WheelStyle } from './components/Wheel';
import { 
  Plus, Trash2, RotateCcw, Trophy, Settings2, Info, 
  Save, History, Clock, Image as ImageIcon, 
  Palette, Layout, Check, X, FolderOpen, Home,
  Download, Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const INITIAL_OPTIONS = ['披萨', '汉堡', '寿司', '火锅', '沙拉', '拉面'];

interface HistoryItem {
  id: string;
  winner: string;
  timestamp: number;
  options: string[];
}

interface SavedConfig {
  id: string;
  name: string;
  options: string[];
  wheelStyle: WheelStyle;
  bgImage: string | null;
  optionImages?: (string | null)[];
  fontColor: string;
}

export default function App() {
  const [options, setOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wheel_options');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_OPTIONS;
    } catch {
      return INITIAL_OPTIONS;
    }
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('wheel_history');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => {
    try {
      const saved = localStorage.getItem('wheel_configs');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [wheelStyle, setWheelStyle] = useState<WheelStyle>(() => {
    return (localStorage.getItem('wheel_style') as WheelStyle) || 'classic';
  });
  const [bgImage, setBgImage] = useState<string | null>(() => {
    return localStorage.getItem('wheel_bg_image');
  });
  const [optionImages, setOptionImages] = useState<(string | null)[]>(() => {
    try {
      const saved = localStorage.getItem('wheel_option_images');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
      
      // Fallback: create array matching options length
      const savedOptions = localStorage.getItem('wheel_options');
      const parsedOptions = savedOptions ? JSON.parse(savedOptions) : null;
      const len = Array.isArray(parsedOptions) ? parsedOptions.length : INITIAL_OPTIONS.length;
      return Array(len).fill(null);
    } catch {
      return Array(INITIAL_OPTIONS.length).fill(null);
    }
  });
  const [fontColor, setFontColor] = useState<string>(() => {
    return localStorage.getItem('wheel_font_color') || '#ffffff';
  });
  const [showOptionImages, setShowOptionImages] = useState<boolean>(() => {
    return localStorage.getItem('wheel_show_option_images') !== 'false';
  });

  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'options' | 'history' | 'settings' | 'configs'>('options');
  const [configName, setConfigName] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  const showNotification = (message: string, type: 'error' | 'success' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('wheel_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('wheel_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('wheel_configs', JSON.stringify(savedConfigs));
  }, [savedConfigs]);

  useEffect(() => {
    localStorage.setItem('wheel_style', wheelStyle);
  }, [wheelStyle]);

  useEffect(() => {
    if (bgImage) localStorage.setItem('wheel_bg_image', bgImage);
    else localStorage.removeItem('wheel_bg_image');
  }, [bgImage]);

  useEffect(() => {
    localStorage.setItem('wheel_font_color', fontColor);
  }, [fontColor]);

  useEffect(() => {
    localStorage.setItem('wheel_show_option_images', String(showOptionImages));
  }, [showOptionImages]);

  useEffect(() => {
    localStorage.setItem('wheel_option_images', JSON.stringify(optionImages));
  }, [optionImages]);

  const handleAddOption = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newOption.trim() && options.length < 10) {
      setOptions([...options, newOption.trim()]);
      setOptionImages([...optionImages, null]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      setOptionImages(optionImages.filter((_, i) => i !== index));
    }
  };

  const handleSpinEnd = useCallback((result: string, index: number) => {
    setWinner(result);
    
    // Set background image to the winning slice's image if it exists
    if (Array.isArray(optionImages) && optionImages[index]) {
      setBgImage(optionImages[index]);
    } else {
      setBgImage(null);
    }

    const newHistoryItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      winner: result,
      timestamp: Date.now(),
      options: [...options]
    };
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
    });
  }, [options, optionImages]);

  const saveCurrentConfig = () => {
    if (!configName.trim()) return;
    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name: configName.trim(),
      options: [...options],
      wheelStyle,
      bgImage: null,
      optionImages: [...optionImages],
      fontColor
    };
    setSavedConfigs([...savedConfigs, newConfig]);
    setConfigName('');
  };

  const loadConfig = (config: any) => {
    setOptions(config.options || INITIAL_OPTIONS);
    setWheelStyle(config.wheelStyle || 'classic');
    setBgImage(null);
    setOptionImages(config.optionImages || Array((config.options || INITIAL_OPTIONS).length).fill(null));
    setFontColor(config.fontColor || '#ffffff');
    setActivePanel('options');
    setWinner(null);
  };

  const deleteConfig = (id: string) => {
    setSavedConfigs(savedConfigs.filter(c => c.id !== id));
  };

  const exportConfigs = () => {
    if (savedConfigs.length === 0) {
      showNotification('没有可导出的配置', 'error');
      return;
    }
    const dataStr = JSON.stringify(savedConfigs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wheel_configs_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('配置已导出');
  };

  const importConfigs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        
        if (Array.isArray(imported)) {
          const validConfigs = imported.filter(c => c.id && c.name && c.options);
          if (validConfigs.length > 0) {
            setSavedConfigs(prev => {
              // Avoid duplicate IDs by generating new ones for imported configs
              const newConfigs = validConfigs.map(c => ({
                ...c,
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
              }));
              return [...prev, ...newConfigs];
            });
            showNotification(`成功导入 ${validConfigs.length} 个配置`);
          } else {
            showNotification('文件格式不正确', 'error');
          }
        } else {
          showNotification('文件格式不正确', 'error');
        }
      } catch (err) {
        showNotification('解析文件失败', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const handleUrlImageUpload = () => {
    if (!imageUrlInput.trim() || editingImageIndex === null) return;
    
    const newImages = Array.isArray(optionImages) ? [...optionImages] : Array(options.length).fill(null);
    while (newImages.length < options.length) {
      newImages.push(null);
    }
    newImages[editingImageIndex] = imageUrlInput.trim();
    setOptionImages(newImages);
    setEditingImageIndex(null);
    setImageUrlInput('');
    setShowUrlModal(false);
    showNotification('图片链接设置成功！');
  };
  const clearHistory = () => {
    setConfirmConfig({
      title: '清空历史记录',
      message: '确定要清空所有中奖记录吗？此操作不可恢复。',
      onConfirm: () => {
        setHistory([]);
        showNotification('历史记录已清空');
      }
    });
    setShowConfirmModal(true);
  };

  const resetWheel = () => {
    setWinner(null);
    setBgImage(null);
  };

  const resetApp = () => {
    setConfirmConfig({
      title: '重置应用数据',
      message: '确定要重置应用吗？这将清空所有选项、历史记录和配置。',
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
    setShowConfirmModal(true);
  };

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 relative overflow-hidden"
    >
      {/* URL Modal */}
      <AnimatePresence>
        {showUrlModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUrlModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">设置图片</h3>
                <button 
                  onClick={() => setShowUrlModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block ml-1">图片 URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                    <button
                      onClick={handleUrlImageUpload}
                      disabled={!imageUrlInput.trim()}
                      className="px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                    >
                      确定
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1">支持直接粘贴图片链接，如 unsplash 或 picsum 的链接。</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && confirmConfig && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">{confirmConfig.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{confirmConfig.message}</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      confirmConfig.onConfirm();
                      setShowConfirmModal(false);
                    }}
                    className="flex-1 py-3 px-6 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                  >
                    确定
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-white font-medium flex items-center gap-2",
              notification.type === 'error' ? "bg-red-500" : "bg-green-500"
            )}
          >
            {notification.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <button 
          onClick={() => setActivePanel('options')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <RotateCcw className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">幸运大轮盘</h1>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActivePanel('options')}
            className={cn(
              "p-2 rounded-full transition-colors",
              activePanel === 'options' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
            )}
            title="首页"
          >
            <Home className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'configs' ? 'options' : 'configs')}
            className={cn(
              "p-2 rounded-full transition-colors",
              activePanel === 'configs' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
            )}
            title="保存的配置"
          >
            <FolderOpen className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'history' ? 'options' : 'history')}
            className={cn(
              "p-2 rounded-full transition-colors",
              activePanel === 'history' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
            )}
            title="历史记录"
          >
            <History className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'settings' ? 'options' : 'settings')}
            className={cn(
              "p-2 rounded-full transition-colors",
              activePanel === 'settings' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
            )}
            title="设置"
          >
            <Settings2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-20 grid lg:grid-cols-2 gap-12 items-start relative z-10">
        {/* Left Column: Wheel */}
        <div className="flex flex-col items-center justify-center space-y-8 py-10">
          <div className="relative">
            <Wheel 
              options={options} 
              onSpinStart={() => {
                setWinner(null);
                setBgImage(null);
              }}
              onSpinEnd={handleSpinEnd} 
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
              wheelStyle={showOptionImages ? wheelStyle : 'luxury'}
              bgImage={bgImage}
              optionImages={showOptionImages ? optionImages : []}
              fontColor={fontColor}
            />
            {/* Result Overlay removed as per user request */}
            
            {/* Result Display Below Wheel */}
            <AnimatePresence>
              {winner && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 text-center"
                >
                  <div className="inline-flex flex-col items-center px-8 py-4 bg-white rounded-3xl shadow-lg border border-slate-100">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">恭喜中奖</span>
                    <h2 className="text-3xl font-black text-slate-800">{winner}</h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center space-y-4">
            <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-1 rounded-full w-fit mx-auto">
              <Info className="w-4 h-4" />
              点击中间的按钮开始旋转
            </p>

            {(winner || bgImage) && (
              <button
                onClick={resetWheel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 text-xs font-bold hover:bg-white hover:shadow-md transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                重置转盘状态
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Panels */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activePanel === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8 h-full"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    自定义选项
                    <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                      {options.length}/10
                    </span>
                  </h2>
                  <p className="text-slate-500 text-sm">添加或删除轮盘上的选项，最少 2 个，最多 10 个。</p>
                </div>

                <form onSubmit={handleAddOption} className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="输入新选项..."
                    maxLength={15}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newOption.trim() || options.length >= 10}
                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </form>

                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {options.map((option, index) => (
                      <motion.div
                        key={`${option}-${index}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'][index % 10] }}
                          />
                          <span className="font-medium text-slate-700">{option}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingImageIndex(index);
                              setShowUrlModal(true);
                            }}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              optionImages[index] 
                                ? "text-blue-600 bg-blue-50" 
                                : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"
                            )}
                            title="设置分块图片"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveOption(index)}
                            disabled={options.length <= 2}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:hidden"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Save className="w-3 h-3" />
                    配置已自动保存
                  </div>
                  <button 
                    onClick={() => setActivePanel('configs')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    保存为新配置
                  </button>
                </div>
              </motion.div>
            )}

            {activePanel === 'configs' && (
              <motion.div
                key="configs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6 h-full"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    配置管理
                  </h2>
                  <p className="text-slate-500 text-sm">保存当前选项或加载已有的配置。</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      placeholder="配置名称 (如: 午餐)"
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                    <button 
                      onClick={saveCurrentConfig}
                      disabled={!configName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      保存当前
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {savedConfigs.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-sm">暂无保存的配置</div>
                    ) : (
                      savedConfigs.map(config => (
                        <div key={config.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-slate-200">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-700">{config.name}</div>
                            <div className="text-[10px] text-slate-400">{config.options.join(', ')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => loadConfig(config)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="加载"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteConfig(config.id)}
                              className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button 
                      onClick={exportConfigs}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      导出配置
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      导入配置
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importConfigs} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6 h-full"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      历史记录
                    </h2>
                    <p className="text-slate-500 text-sm">查看最近的转盘结果。</p>
                  </div>
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
                  >
                    清空
                  </button>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                      <History className="w-12 h-12 text-slate-200 mx-auto" />
                      <p className="text-slate-400 text-sm">暂无历史记录</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold">{item.winner}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.options.map((opt, i) => (
                            <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-100 text-slate-500">
                              {opt}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            setOptions(item.options);
                            setActivePanel('options');
                          }}
                          className="w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          恢复此配置
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activePanel === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8 h-full"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    个性化设置
                  </h2>
                  <p className="text-slate-500 text-sm">调整转盘外观和应用背景。</p>
                </div>

                {/* Style Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Palette className="w-4 h-4" />
                    转盘样式
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(['classic', 'neon', 'minimal', 'luxury', 'custom'] as WheelStyle[]).map(style => (
                      <button
                        key={style}
                        onClick={() => setWheelStyle(style)}
                        className={cn(
                          "px-4 py-3 rounded-2xl border-2 transition-all text-sm font-medium capitalize",
                          wheelStyle === style 
                            ? "border-blue-600 bg-blue-50 text-blue-600" 
                            : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                        )}
                      >
                        {style === 'custom' ? '自定义图片' : style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Color */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Palette className="w-4 h-4" />
                    文字颜色
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['#ffffff', '#000000', '#FF6B6B', '#4ECDC4', '#F7DC6F', '#BB8FCE'].map(color => (
                        <button
                          key={color}
                          onClick={() => setFontColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            fontColor === color ? "border-blue-600 scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Show Option Images Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <ImageIcon className="w-4 h-4" />
                      显示分块图片
                    </div>
                    <button
                      onClick={() => setShowOptionImages(!showOptionImages)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        showOptionImages ? "bg-blue-600" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        showOptionImages ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">关闭后，转盘在旋转前将只显示颜色块，不显示自定义图片。</p>
                </div>

                {/* Reset App */}
                <div className="pt-8 border-t border-slate-100">
                  <button
                    onClick={resetApp}
                    className="w-full py-4 px-6 rounded-2xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    重置应用数据
                  </button>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    如果应用运行异常或存储空间不足，请尝试重置。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 py-4 lg:hidden z-50">
        <div className="max-w-5xl mx-auto px-6 flex justify-around">
           <button 
            onClick={() => setActivePanel('options')}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold",
              activePanel === 'options' ? "text-blue-600" : "text-slate-400"
            )}
           >
             <Home className="w-5 h-5" />
             首页
           </button>
           <button 
            onClick={() => setActivePanel('configs')}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold",
              activePanel === 'configs' ? "text-blue-600" : "text-slate-400"
            )}
           >
             <FolderOpen className="w-5 h-5" />
             配置
           </button>
           <button 
            onClick={() => setActivePanel('history')}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold",
              activePanel === 'history' ? "text-blue-600" : "text-slate-400"
            )}
           >
             <History className="w-5 h-5" />
             历史
           </button>
           <button 
            onClick={() => setActivePanel('settings')}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold",
              activePanel === 'settings' ? "text-blue-600" : "text-slate-400"
            )}
           >
             <Settings2 className="w-5 h-5" />
             设置
           </button>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
