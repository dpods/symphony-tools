# composer-quant-tools
Chrome Extension that provides tools and enhancements to the Composer.trade user interface.

### Features
- Portfolio
  - Display quant stats for live symphonies
  - Build Tearsheets in context for individual symphonies. Live, OOS, and full Backtest

Aggregate Holdings
![Composer Quant Tools - Portfolio](docs/images/portfolio.png)

Symphony Editor
![Composer Quant Tools - Symphony Editor](docs/images/symphony-editor.png)

### Installation

#### Chrome Web Store
The easiest way to install the extension is through the Chrome Web Store.

1. Go to https://chromewebstore.google.com/detail/symphony-tools-extension/gbmghoigiaomcfnnoijngbdnglpifbkk
2. Click "Add to Chrome"
3. If you have the composer site open in your browser, refresh the page so the widget can load. 
4. Where to find the widgets
    1. In the Symphony editor, the widget should appear on the sidebar under the Watch/Share buttons.
    2. In the portfolio view, the widget should appear at the bottom of the page under all your live symphonies

#### Manual Installation
1. Go to the latest release and download the .zip file
    https://github.com/jhicken/symphony-tools/releases/latest
2. Unzip the contents 
3. In Chrome, navigate to [chrome://extensions](chrome://extensions/) in the URL bar
4. Run "npm run setup"
5. Click the **Load unpacked** button and select the `src` folder (where the `manifest.json` file is).
6. If you have the composer site open in your browser, refresh the page so the widget can load.
7. Where to find the widgets
   1. In the Symphony editor, the widget should appear on the sidebar under the Watch/Share buttons. 
   2. In the portfolio view, the widget should appear at the bottom of the page under all your live symphonies


### Troubleshooting

Failed to load extension

**Manifest file is missing or unreadable** - Make sure you've unzipped the file. After clicking "Load unpacked" on the extensions page, navigate to the unzipped folder and click "Select"
