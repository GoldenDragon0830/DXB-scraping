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

        await waitForTimeout(3000);
        
        await page.waitForSelector("#LocationsStack > a", {timeout: 30000});
        await page.click('#LocationsStack > a');

        await page.waitForSelector("#SearchInput", {timeout: 30000});
        await page.type('#SearchInput', 'Jumeirah Lakes Towers');
        
        await page.waitForSelector('#AreasList > article:first-of-type', { timeout: 30000 });
        await page.click('#AreasList > article:first-of-type');

        await waitForTimeout(2000);
        
        await page.waitForSelector('#R7990151324798006877 > div > ul > li:nth-child(3)', { timeout: 30000 });
        await page.click('#R7990151324798006877 > div > ul > li:nth-child(3)');

        await waitForTimeout(2000);

        let detailCount = 0;

        do{
            const detailButtons = await page.$$('a.t-Button--iconRight');

            console.log('Row count => ', detailButtons.length);
    
            if (detailButtons.length > 0) {
                detailCount += detailButtons.length;
                // await detailButtons[0].click();
                // await waitForTimeout(2000);
            }

            nextButton = await page.$$('a#soldhistorynext');

            if(nextButton.length > 0)
                nextButton[0].click();
            await waitForTimeout(2000);
        }while((await page.$$('a#soldhistorynext')) != []);

        console.log('Total detail => ', detailCount);

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