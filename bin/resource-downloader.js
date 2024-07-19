import fs from 'fs';
import path from 'path';
import https from 'https';

// Get the directory of the script
// Set the download directory for pyodide
const pyodideDownloadDir = new URL('../src/lib/pyodide', import.meta.url).pathname;
const choiceJsDownloadDir = new URL('../src/lib/choicejs', import.meta.url).pathname;



// Function to download file if it doesn't exist
const downloadIfNotExists = (url, downloadDir) => {
  const fileName = path.basename(url);
  const filePath = path.join(downloadDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`${fileName} already exists. Skipping download.`);
  } else {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${fileName}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`Error downloading ${fileName}: ${err.message}`);
    });
  }
};

// URLs to download
const pyodideUrls = [
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/python_stdlib.zip",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.asm.wasm",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide-lock.json",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.asm.js",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pandas-2.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/python_dateutil-2.9.0.post0-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/six-1.16.0-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pytz-2024.1-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/micropip-0.6.0-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/packaging-23.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/ipython-8.23.0-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/asttokens-2.4.1-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/decorator-5.1.1-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/executing-2.0.1-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/matplotlib_inline-0.1.7-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/traitlets-5.14.3-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/prompt_toolkit-3.0.43-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pure_eval-0.2.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pygments-2.17.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/stack_data-0.6.3-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/sqlite3-1.0.0.zip",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/wcwidth-0.2.13-py2.py3-none-any.whl",
  "https://files.pythonhosted.org/packages/bc/02/306226b38cc51972853f56866a566f224cf3855d1e3b492a774fb00c71a5/QuantStats-0.0.62-py2.py3-none-any.whl",
  "https://files.pythonhosted.org/packages/83/11/00d3c3dfc25ad54e731d91449895a79e4bf2384dc3ac01809010ba88f6d5/seaborn-0.13.2-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/40/44/4a5f08c96eb108af5cb50b41f76142f0afa346dfa99d5296fe7202a11854/tabulate-0.9.0-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/7d/76/31fb9c58398f4cbdde4a0831d0407a1ca987fe828c7da9ce80969014a5a1/yfinance-0.2.40-py2.py3-none-any.whl",
  "https://files.pythonhosted.org/packages/d5/a6/6c61e137d71b1452f200f31788fdb6f9e54465967fd15de3870dd4249b96/frozendict-2.4.4-py312-none-any.whl",
  "https://files.pythonhosted.org/packages/68/13/2aa1f0e1364feb2c9ef45302f387ac0bd81484e9c9a4c5688a322fbdfd08/platformdirs-4.2.2-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/3e/8a/bb3160e76e844db9e69a413f055818969c8acade64e1a9ac5ce9dfdcf6c1/multitasking-0.0.11-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/matplotlib-3.5.2-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/cycler-0.12.1-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/fonttools-4.51.0-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/kiwisolver-1.4.5-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyparsing-3.1.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/matplotlib_pyodide-0.2.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/openblas-0.3.26.zip",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/requests-2.31.0-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/charset_normalizer-3.3.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/idna-3.7-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/urllib3-2.2.1-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/certifi-2024.2.2-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/beautifulsoup4-4.12.3-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/soupsieve-2.5-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/peewee-3.17.3-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/cffi-1.16.0-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pycparser-2.22-py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/lxml-5.2.1-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/html5lib-1.1-py2.py3-none-any.whl",
  "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/webencodings-0.5.1-py2.py3-none-any.whl",
]

const choiceJsUrls = [
  "https://cdn.jsdelivr.net/npm/choices.js@9.0.1/public/assets/styles/base.min.css",
  "https://cdn.jsdelivr.net/npm/choices.js@9.0.1/public/assets/styles/choices.min.css",
  "https://cdn.jsdelivr.net/npm/choices.js@9.0.1/public/assets/scripts/choices.min.js",
]


function downloadResources(urls, downloadDir) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  urls.forEach(url => downloadIfNotExists(url, downloadDir));
}

downloadResources(pyodideUrls, pyodideDownloadDir);
downloadResources(choiceJsUrls, choiceJsDownloadDir);
