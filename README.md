# symphony-tools
Chrome Extension that provides tools to manipulate Composer Symphonies during editing and backtesting. 

⚠️Limitations ⚠️
The extension was originally built to provide a tagging functionality on the Asset nodes of the Symphony JSON. Those tags are displayed under the Asset ticker symbols in the Live Holdings section on the portfolio page, so it appeared that this was a viable way to correlate a Symphony's live holdings with the branching logic to determine how the Symphony selected which trades to place. 

Upon further review, this extension does not provide an accurate way to correlate a Symphony's live holdings with the branching logic that was used to place those trades. The portfolio view shows a single allocation percentage for each holding in a Symphony, but it's unable to determine if the allocation percentage is the result of one logic branch, or multiple logic branches combined. Therefore, it's not recommended to use this tagging tool for analyzing how a Symphony decides what and when to trade. 

### Installation

1. Go to the latest release and download the .zip file
https://github.com/dpods/symphony-tools/releases/latest
2. Unzip the contents 
3. In Chrome, navigate to [chrome://extensions](chrome://extensions/) in the URL bar 
4. Click the **Load unpacked** button and select the folder where the unzipped contents are. 
5. Click the Extensions puzzle piece icon in your Chrome browser and click the pin icon to pin it to your browser toolbar. 

### Features
- Ability to add unique "tags" to each Asset in a Symphony (Deprecated - see limitations above)
- Ability to remove "tags" from each Asset in a Symphony (This will be kept around to clean up any Symphonies that had tags added)
- (Planned) Expand/collapse all branches in a Symphony with 1 click.
- (Planned) Search and replace for Assets in a Symphony

### Donate

Donations are welcome but not necessary. If you find this tool useful you can donate here to support the development and maintenance to keep it working.

<a href="https://www.buymeacoffee.com/dpods" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
