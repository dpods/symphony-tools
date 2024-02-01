# symphony-tools
Chrome Extension that allows you to tag each Asset with metadata that will show up on your portfolio's live holdings. You can use this tag to correlate which logic branches were executed during the trading period by looking up each tag in the Editor. 

### Installation

1. Go to the latest release and download the .zip file
https://github.com/dpods/symphony-tools/releases/latest
2. Unzip the contents 
3. In Chrome, navigate to [chrome://extensions](chrome://extensions/) in the URL bar 
4. Click the **Load unpacked** button and select the folder where the unzipped contents are. 
5. Click the Extensions puzzle piece icon in your Chrome browser and click the pin icon to pin it to your browser toolbar. 

### How to use

1. Pull up any Symphony in editor mode. The url must look like https://app.composer.trade/symphony/0WHVQoRncupHxAACqcCT
2. Click the Symphony Tools extension and then click **Tag Assets**
3. All assets should be prefixed with square brakcets and a number. Each asset will be given a unique number for that Symphony. 
4. On your portfolio page ([https://app.composer.trade/portfolio](https://app.composer.trade/portfolio)) click the arrow next to the Symphony name to expand the Live Holdings. Each asset that you're holding will show the unique number in the square brackets. This number corresponds to the same number in the Editor. You can use this number to lookup the asset in the Editor to figure out which logic branches were executed during the trading period. 