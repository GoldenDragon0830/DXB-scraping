const puppeteer = require('puppeteer');

async function scrapeTransactionDetails(url) {
    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: 'load', // Wait until the network is idle
            timeout: 100000, // 60 seconds timeout
        });

        await page.waitForSelector('#SearchInput');
        await page.type('#SearchInput', 'Jumeirah Lakes Towers');

        await page.waitForSelector('#AreasList', { visible: true, timeout: 10000 });

        const areasListHTML = await page.evaluate(() => {
            const element = document.querySelector('#AreasList');
            return element ? element.innerHTML : 'Element not found';
        });

        console.log('AreasList HTML:', areasListHTML);
  
        await page.screenshot({ path: 'debug.png', fullPage: true });

        await page.waitForSelector('#AreasList > article:first-of-type', { visible: true, timeout: 10000 });
        await page.click('#AreasList > article:first-of-type');

        await page.waitForSelector('.submit-btn');
        await page.click('.submit-btn');
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
        console.log('Browser closed');
    }
}


const targetUrl = 'https://dxbinteract.com/';

scrapeTransactionDetails(targetUrl)
  .then(results => {
    console.log(`Scraping completed. Extracted ${results?.length || 0} transaction details.`);
  })
  .catch(error => console.error('Scraping failed:', error));