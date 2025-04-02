const { timeout } = require('puppeteer');
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
        
        await page.waitForSelector('#R7990151324798006877 > div > ul > li:nth-child(2)', { timeout: 30000 });
        await page.click('#R7990151324798006877 > div > ul > li:nth-child(2)');

        await waitForTimeout(2000);

        let detailCount = 0;

        let index = 0;

        do{
            const detailButtons = await page.$$('a.t-Button--iconRight');

            console.log('Row count => ', detailButtons.length);
    
            if (detailButtons.length > 0) {
                detailCount += detailButtons.length;
                for(let i=0; i<detailButtons.length ; i++) {
                    await detailButtons[i].click();
                    await waitForTimeout(3000);
                    index++;
                    console.log(index);

                    await page.waitForSelector('#apex_dialog_1', { timeout: 3000 });
                    
                    const frameHandle = await page.waitForSelector('#apex_dialog_1 > iframe');
                    const frame = await frameHandle.contentFrame();
                    
                    const textContent = await frame.evaluate(() => {
                        const element = document.querySelector("#R2456939146277048660 > a-dynamic-content > div > div > div > h2 > b");
                        return element ? element.innerText.trim() : null;
                    });
            
                    console.log(textContent);

                    await page.waitForSelector("#t_PageBody > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-dialog--apex.t-Dialog-page--standard.ui-draggable > div.ui-dialog-titlebar.ui-corner-all.ui-widget-header.ui-helper-clearfix.ui-draggable-handle > button", { timeout: 30000 });
                    await page.click("#t_PageBody > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-dialog--apex.t-Dialog-page--standard.ui-draggable > div.ui-dialog-titlebar.ui-corner-all.ui-widget-header.ui-helper-clearfix.ui-draggable-handle > button");
                }
            }

            const nextButton = await page.$$('a#soldhistorynext');

            if(nextButton.length > 0)
                nextButton[0].click();
            else
                break;

            await waitForTimeout(2000);
        }while(1);

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