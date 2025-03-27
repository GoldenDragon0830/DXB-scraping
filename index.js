const puppeteer = require('puppeteer');

async function waitForTimeout(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

async function scrapeTransactionDetails(url) {

    const proxyServer = 'ultra.marsproxies.com:44445';

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

        await page.authenticate({
            username: 'mr89036ikxS',
            password: 'MvE5Z1dhWK_country-tr_city-malatya_session-i1hisgf5_lifetime-168h'
        });

        await page.goto(url, {
            waitUntil: 'load', // Wait until the network is idle
            timeout: 60000, // 60 seconds timeout
        });

        // await waitForTimeout(3000);
        // await page.waitForSelector("#134_menubar_1i", {timeout: 30000});
        // await page.click('#134_menubar_1i');
        
        // await page.waitForSelector('#FeaturedSearches > article:nth-child(1)', {timeout: 30000});
        
        // await page.waitForSelector('#SearchInput');
        // await page.click('#SearchInput');
        // await page.type('#SearchInput', 'Jumeirah Lakes Towers');
  
        // // await page.screenshot({ path: 'debug.png', fullPage: true });

        // await page.waitForSelector('#AreasList > article:first-of-type', { visible: true, timeout: 30000 });
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


const targetUrl = 'https://www.upwork.com/';

scrapeTransactionDetails(targetUrl)
  .then(results => {
    console.log(`Scraping completed. Extracted ${results?.length || 0} transaction details.`);
  })
  .catch(error => console.error('Scraping failed:', error));