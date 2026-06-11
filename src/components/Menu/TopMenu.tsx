import { useState, useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { downloadMidi } from '../../utils/midi';
import { downloadWav } from '../../utils/audioExport';
import { saveProject, loadProject, listProjects, exportProjectJSON, importProjectJSON, deleteProject } from '../../utils/projectStorage';
import { stopPlayback } from '../../audio/engine';

interface SavedProject {
  id: string;
  name: string;
  updatedAt: number;
}

export default function TopMenu() {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const id = Date.now().toString();
    await saveProject(id, saveName || 'Untitled', project);
    setShowSaveDialog(false);
    setSaveName('');
  };

  const handleLoad = async (id: string) => {
    const p = await loadProject(id);
    if (p) {
      setProject(p);
      stopPlayback();
    }
    setShowLoadDialog(false);
  };

  const handleExportWav = async () => {
    setLoading(true);
    try {
      await downloadWav(project);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMidi = () => {
    downloadMidi(project);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = await importProjectJSON(file);
      setProject(p);
      stopPlayback();
    } catch (err) {
      alert('Invalid project file');
    }
    e.target.value = '';
  };

  const openLoadDialog = async () => {
    const list = await listProjects();
    setSavedProjects(list);
    setShowLoadDialog(true);
  };

  return (
    <div className="top-menu">
      <div className="menu-brand">Musicafree</div>
      <div className="menu-items">
        <div className="menu-dropdown">
          <button className="menu-btn" onClick={() => setShowFileMenu(!showFileMenu)}>File</button>
          {showFileMenu && (
            <div className="dropdown-content">
              <button onClick={() => { setShowSaveDialog(true); setShowFileMenu(false); }}>Save Project</button>
              <button onClick={() => { openLoadDialog(); setShowFileMenu(false); }}>Load Project</button>
              <button onClick={() => { exportProjectJSON(project); setShowFileMenu(false); }}>Export as JSON</button>
              <button onClick={() => { fileInputRef.current?.click(); setShowFileMenu(false); }}>Import JSON</button>
              <div className="dropdown-divider" />
              <button onClick={() => { handleExportMidi(); setShowFileMenu(false); }}>Export MIDI</button>
              <button onClick={() => { handleExportWav(); setShowFileMenu(false); }} disabled={loading}>
                {loading ? 'Rendering...' : 'Export WAV'}
              </button>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {showSaveDialog && (
        <div className="dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Project</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Project name..."
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div className="dialog-overlay" onClick={() => setShowLoadDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Load Project</h3>
            {savedProjects.length === 0 ? (
              <p className="no-projects">No saved projects</p>
            ) : (
              <div className="project-list">
                {savedProjects.map((p) => (
                  <div key={p.id} className="project-item">
                    <span>{p.name}</span>
                    <span className="project-date">{new Date(p.updatedAt).toLocaleDateString()}</span>
                    <div className="project-actions">
                      <button onClick={() => handleLoad(p.id)}>Load</button>
                      <button onClick={async () => { await deleteProject(p.id); openLoadDialog(); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="dialog-buttons">
              <button onClick={() => setShowLoadDialog(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
