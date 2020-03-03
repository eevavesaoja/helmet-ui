import React, {useState, useEffect, useRef} from 'react';
import Store from 'electron-store';

const homedir = require('os').homedir();
const {ipcRenderer} = require('electron');
const {execSync} = require('child_process');
const path = require('path');

// vex-js imported globally in index.html, since we cannot access webpack config in electron-forge

const App = ({helmetUIVersion, versions, searchEMMEPython}) => {

  // Global settings
  const [isSettingsOpen, setSettingsOpen] = useState(false); // whether Settings -dialog is open
  const [isProjectRunning, setProjectRunning] = useState(false); // whether currently selected Project is running
  const [emmePythonPath, setEmmePythonPath] = useState(undefined); // file path to EMME python executable
  const [helmetScriptsPath, setHelmetScriptsPath] = useState(undefined); // folder path to HELMET model system scripts
  const [projectPath, setProjectPath] = useState(undefined); // folder path to scenario configs, default homedir
  const [basedataPath, setBasedataPath] = useState(undefined); // folder path to base input data (subdirectories: 2016_zonedata, 2016_basematrices)
  const [resultsPath, setResultsPath] = useState(undefined); // folder path to Results directory
  const [isDownloadingHelmetScripts, setDownloadingHelmetScripts] = useState(false); // whether downloading "/Scripts" is in progress
  const [dlHelmetScriptsVersion, setDlHelmetScriptsVersion] = useState(undefined); // which version is being downloaded

  // Global settings store contains "emme_python_path", "helmet_scripts_path", "project_path", "basedata_path", and "resultdata_path".
  const globalSettingsStore = useRef(new Store());

  const _setEMMEPythonPath = (newPath) => {
    setEmmePythonPath(newPath);
    globalSettingsStore.current.set('emme_python_path', newPath);
  };

  const _setHelmetScriptsPath = (newPath) => {
    // Cannot use state variable since it'd be undefined at times
    const pythonPath = globalSettingsStore.current.get('emme_python_path');
    try {
      execSync(`"${path.join(path.dirname(pythonPath), "Scripts", "pip.exe")}" install --user -r "${path.join(newPath, "requirements.txt")}"`);
    } catch (e) {
      console.log(e);
      console.log("No requirements file found for HELMET Scripts. Some functionality may not work properly.");
    }
    setHelmetScriptsPath(newPath);
    globalSettingsStore.current.set('helmet_scripts_path', newPath);
  };

  const _setProjectPath = (newPath) => {
    setProjectPath(newPath);
    globalSettingsStore.current.set('project_path', newPath);
  };

  const _setBasedataPath = (newPath) => {
    setBasedataPath(newPath);
    globalSettingsStore.current.set('basedata_path', newPath);
  };

  const _setResultsPath = (newPath) => {
    setResultsPath(newPath);
    globalSettingsStore.current.set('resultdata_path', newPath);
  };

  const _promptModelSystemDownload = () => {
    fetch('https://api.github.com/repos/HSLdevcom/helmet-model-system/tags')
      .then((response) => {
        return response.json();
      })
      .then((tags) => {
        vex.dialog.open({
          message: "Valitse model-system versio:",
          input: [
            '<div class="vex-custom-field-wrapper">',
              '<select name="version">',
                tags.map((tag) => `<option value="${tag.name}">${tag.name}</option>`).join(''),
              '</select>',
            '</div>'
          ].join(''),
          callback: (data) => {
            if (!data) {
              // Cancelled
              return;
            }
            const now = new Date();
            setDlHelmetScriptsVersion(data.version);
            setDownloadingHelmetScripts(true);
            ipcRenderer.send(
              'message-from-ui-to-download-helmet-scripts',
              {
                version: data.version,
                destinationDir: homedir,
                postfix: `${('00'+now.getDate()).slice(-2)}-${('00'+now.getMonth()).slice(-2)}-${Date.now()}`, // DD-MM-epoch
              }
            );
          }
        });
      });
  };

  // Electron IPC event listeners
  const onDownloadReady = (event, savePath) => {
    _setHelmetScriptsPath(savePath, emmePythonPath);
    setDownloadingHelmetScripts(false);
  };

  useEffect(() => {
    // Attach Electron IPC event listeners (to worker => UI events)
    ipcRenderer.on('download-ready', onDownloadReady);

    // Search for EMME's Python if not set in global store (default win path is %APPDATA%, should remain there [hidden from user])
    if (!globalSettingsStore.current.get('emme_python_path')) {
      const [found, pythonPath] = searchEMMEPython();
      if (found) {
        if (confirm(`Python ${versions.emme_python} löytyi sijainnista:\n\n${pythonPath}\n\nHaluatko käyttää tätä sijaintia?`)) {
          globalSettingsStore.current.set('emme_python_path', pythonPath);
        }
      } else {
        alert(`Emme ${versions.emme_system} ja Python ${versions.emme_python} eivät löytyneet oletetusta sijainnista.\n\nMääritä Pythonin sijainti Asetukset-dialogissa.`);
      }
    }
    // Copy existing global store values to state. Remember: state updates async so refer to existing.
    const existingEmmePythonPath = globalSettingsStore.current.get('emme_python_path');
    const existingHelmetScriptsPath = globalSettingsStore.current.get('helmet_scripts_path');
    const existingProjectPath = globalSettingsStore.current.get('project_path');
    const existingBasedataPath = globalSettingsStore.current.get('basedata_path');
    const existingResultsPath = globalSettingsStore.current.get('results_path');
    setEmmePythonPath(existingEmmePythonPath);
    setHelmetScriptsPath(existingHelmetScriptsPath);
    setProjectPath(existingProjectPath);
    setBasedataPath(existingBasedataPath);
    setResultsPath(existingResultsPath);

    // If project path is the initial (un-set), set it to homedir. Remember: state updates async so refer to existing.
    if (!existingProjectPath) {
      _setProjectPath(homedir);
    }

    // If HELMET Scripts is the initial (un-set), download latest version and use that. Remember: state updates async so refer to existing.
    if (!existingHelmetScriptsPath && confirm("Ladataanko model-system automaattisesti? (Vaatii internet-yhteyden \u{0001F4F6})")) {
      _promptModelSystemDownload();
    // Else if required paths are un-set, open settings anyway
    } else if (!existingBasedataPath || !existingResultsPath) {
      setSettingsOpen(true);
    }

    return () => {
      // Detach Electron IPC event listeners
      ipcRenderer.removeListener('download-ready', onDownloadReady);
    }
  }, []);

  return (
    <div className={"App" + (isProjectRunning ? " App--busy" : "")}>

      {/* Pop-up global settings dialog with overlay behind it */}
      <div className="App__settings" style={{display: isSettingsOpen ? "block" : "none"}}>
        <Settings
          emmePythonPath={emmePythonPath}
          helmetScriptsPath={helmetScriptsPath}
          projectPath={projectPath}
          basedataPath={basedataPath}
          resultsPath={resultsPath}
          dlHelmetScriptsVersion={dlHelmetScriptsVersion}
          isDownloadingHelmetScripts={isDownloadingHelmetScripts}
          closeSettings={() => setSettingsOpen(false)}
          setEMMEPythonPath={_setEMMEPythonPath}
          setHelmetScriptsPath={_setHelmetScriptsPath}
          setProjectPath={_setProjectPath}
          setBasedataPath={_setBasedataPath}
          setResultsPath={_setResultsPath}
          promptModelSystemDownload={_promptModelSystemDownload}
        />
      </div>

      {/* UI title bar, app-version, etc. */}
      <div className="App__header">
        Helmet 4.0
        &nbsp;
        <span className="App__header-version">{`UI v${helmetUIVersion}`}</span>
        <button className="App__open-settings-btn"
                style={{display: isSettingsOpen ? "none" : "block"}}
                onClick={(e) => setSettingsOpen(true)}
                disabled={isProjectRunning}
        >
          Projektin asetukset
        </button>
      </div>

      {/* HELMET Project -specific content, including runtime- & per-scenario-settings */}
      <div className="App__body">
        <HelmetProject
          emmePythonPath={emmePythonPath}
          helmetScriptsPath={helmetScriptsPath}
          projectPath={projectPath ? projectPath : homedir}
          basedataPath={basedataPath}
          resultsPath={resultsPath}
          signalProjectRunning={setProjectRunning}
        />
      </div>
    </div>
  )
};
