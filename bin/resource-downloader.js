import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Get the directory of the script
// Set the download directory for pyodide
const pyodideDownloadDir = path.resolve(__dirname, '../src/lib/pyodide');
const jsLibDownloadDir = path.resolve(__dirname, '../src/lib/jslib');



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
  "https://files.pythonhosted.org/packages/f3/cb/ee847ea5320428f036bd2d9db399ce5553754645d72e24969be2f4b6cedd/quantstats_lumi-0.3.3-py2.py3-none-any.whl",
  "https://files.pythonhosted.org/packages/83/11/00d3c3dfc25ad54e731d91449895a79e4bf2384dc3ac01809010ba88f6d5/seaborn-0.13.2-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/40/44/4a5f08c96eb108af5cb50b41f76142f0afa346dfa99d5296fe7202a11854/tabulate-0.9.0-py3-none-any.whl",
  "https://files.pythonhosted.org/packages/bc/5b/b8d04f920d4be17e938a8ebad48941fbb0b97b1672897178c0d470734fd2/yfinance-0.2.48-py2.py3-none-any.whl",
  "https://files.pythonhosted.org/packages/ba/d0/d482c39cee2ab2978a892558cf130681d4574ea208e162da8958b31e9250/frozendict-2.4.6-py312-none-any.whl",
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

const jsLib = [
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.3/jquery-ui.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.default.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/js/selectize.min.js",
  "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js",
]


function downloadResources(urls, downloadDir) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  urls.forEach(url => downloadIfNotExists(url, downloadDir));
}

downloadResources(pyodideUrls, pyodideDownloadDir);
downloadResources(jsLib, jsLibDownloadDir);
