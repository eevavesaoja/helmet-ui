import React from 'react';
import path from "path";

const Settings = ({
  emmePythonPath, setEMMEPythonPath,
  helmetScriptsPath, setHelmetScriptsPath, dlHelmetScriptsVersion, isDownloadingHelmetScripts,
  projectPath, setProjectPath,
  closeSettings,
  promptModelSystemDownload,
}) => {
  return (
    <div className="Settings">

      <div className="Settings__overlay">{/* Dark background overlay */}</div>

      <div className="Settings__dialog">
        <div className="Settings__dialog-heading">Projektin asetukset</div>
        <div className="Settings__dialog-input-group">
          <span className="Settings__pseudo-label">EMME Python (v2.7)</span>
          <label className="Settings__pseudo-file-select" htmlFor="hidden-input-emme-python-path" title={emmePythonPath}>
            {emmePythonPath ? path.basename(emmePythonPath) : "Valitse.."}
          </label>
          <input className="Settings__hidden-input"
                 id="hidden-input-emme-python-path"
                 type="file"
                 accept=".exe"
                 onChange={(e) => setEMMEPythonPath(e.target.files[0].path)}
          />
        </div>
        <div className="Settings__dialog-input-group">
          <span className="Settings__pseudo-label">HELMET model-system</span>
          {isDownloadingHelmetScripts ?
            <span className="Settings__pseudo-file-select">
              Downloading model-system {dlHelmetScriptsVersion === 'master' ? 'latest' : dlHelmetScriptsVersion}. . .
            </span>
            :
            <label className="Settings__pseudo-file-select" htmlFor="hidden-input-helmet-scripts-path" title={helmetScriptsPath}>
              {helmetScriptsPath ? path.basename(helmetScriptsPath) : "Valitse.."}
            </label>
          }
          <input className="Settings__hidden-input"
                 id="hidden-input-helmet-scripts-path"
                 type="file"
                 webkitdirectory=""
                 directory=""
                 onChange={(e) => setHelmetScriptsPath(e.target.files[0].path, emmePythonPath)}
          />
          <button className="Settings__beside-input-btn"
                  onClick={(e) => {promptModelSystemDownload()}}
          >
            Lataa eri versio (vaatii internet-yhteyden {'\u{0001F4F6}'})
          </button>
        </div>
        <div className="Settings__dialog-input-group">
          <span className="Settings__pseudo-label">Projektin kansiopolku (oletusarvoisesti kotihakemistosi)</span>
          <label className="Settings__pseudo-file-select" htmlFor="hidden-input-project-path" title={projectPath}>
            {projectPath ? path.basename(projectPath) : "Valitse.."}
          </label>
          <input className="Settings__hidden-input"
                 id="hidden-input-project-path"
                 type="file"
                 webkitdirectory=""
                 directory=""
                 onChange={(e) => setProjectPath(e.target.files[0].path)}
          />
        </div>
        <div className="Settings__dialog-controls">
          <button onClick={(e) => closeSettings()}>
            Sulje
          </button>
        </div>
      </div>

    </div>
  )
};
