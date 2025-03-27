const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function waitForTimeout(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

async function scrapeTransactionDetails(url) {

    const proxyServer = '137.59.4.211:6080';

    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        args: [
            '--start-maximized',
            `--proxy-server=${proxyServer}`
        ]
    });

    try {
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.180 Safari/537.36');

        await page.setExtraHTTPHeaders({
            'accept-language': 'en-US,en;q=0.9',
        });

        await page.authenticate({
            username: 'PICpic123',
            password: 'upwork123'
        });

        await page.goto(url, {
            waitUntil: 'load', // Wait until the network is idle
            timeout: 60000, // 60 seconds timeout
        });

        waitForTimeout(3000);
        
        await page.waitForSelector("#LocationsStack > a", {timeout: 30000});
        await page.click('#LocationsStack > a');

        // await page.waitForSelector("#SearchInput", {timeout: 30000});
        // await page.click('#SearchInput');
        // await page.type('#SearchInput', 'Jumeirah Lakes Towers');
        
        // await page.waitForSelector('#AreasList > article:first-of-type', { timeout: 30000 });
        // await page.click('#AreasList > article:first-of-type');

        // await page.waitForSelector('.submit-btn');
        // await page.click('.submit-btn');

        // await waitForTimeout(10000);
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        // await browser.close();
        console.log('Browser closed');
    }
}


const targetUrl = 'https://dxbinteract.com/dubai-house-prices/';

scrapeTransactionDetails(targetUrl)
  .then(results => {
    console.log(`Scraping completed. Extracted ${results?.length || 0} transaction details.`);
  })
  .catch(error => console.error('Scraping failed:', error));