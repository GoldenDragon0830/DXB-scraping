const { timeout } = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

    const allDetails = [];

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
        await page.click('#R7990151324798006877 > div > ul > li:nth-child(7)');

        await waitForTimeout(2000);

        let detailCount = 0;

        let index = 0;

        let pageNum = 0;

        do{
            // pageNum++;
            // if(pageNum < 20) {
            //     const nextButton = await page.$$('a#soldhistorynext');
            //     if(nextButton.length > 0)
            //         nextButton[0].click();
            //     else
            //         break;

            //     await waitForTimeout(2000);
            //     continue;
            // }

            const detailButtons = await page.$$('a.t-Button--iconRight');

            console.log('Row count => ', detailButtons.length);
    
            if (detailButtons.length > 0) {
                detailCount += detailButtons.length;
                for(let i=0; i<detailButtons.length ; i++) {
                    await detailButtons[i].click();
                    await waitForTimeout(3000);
                    index++;
                    console.log(index);

                    await page.waitForSelector(`#apex_dialog_${index}`, { visible: true });
                    let frameHandle = await page.waitForSelector(`#apex_dialog_${index} > iframe`, {timeout: 3000});
                    let frame = await frameHandle.contentFrame();

                    await frame.waitForSelector('#R2456939146277048660 > a-dynamic-content > div > div > div > h1', { timeout: 3000 });

                    let content = await frame.evaluate(() => {

                        const soldPriceElement = document.querySelector("#R2456939146277048660 > a-dynamic-content > div > div > div > h1");
                        const soldPrice =  soldPriceElement ? soldPriceElement.innerText.trim() : null;

                        const priceUnitElement = document.querySelector("#R2456939146277048660 > a-dynamic-content > div > div > div > h1 > sub");
                        const priceUnit =  priceUnitElement ? priceUnitElement.innerText.trim() : null;

                        const dateElement = document.querySelector("#R2456939146277048660 > a-dynamic-content > div > div > div > div > div:nth-child(2)");
                        const date =  dateElement ? dateElement.innerText.trim() : null;

                        const addressElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(2) > b");
                        const address =  addressElement ? addressElement.innerText.trim() : null;

                        const bedElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(6) > b");
                        const bedroom =  bedElement ? bedElement.innerText.trim() : null;

                        const categoryElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(8) > b");
                        const category =  categoryElement ? categoryElement.innerText.trim() : null;

                        const sizeElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(10) > b");
                        const unitSize =  sizeElement ? sizeElement.innerText.trim() : null;

                        const prevPriceElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(12) > b");
                        const prevPrice =  prevPriceElement ? prevPriceElement.innerText.trim() : null;

                        const statusElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(14) > b");
                        const status =  statusElement ? statusElement.innerText.trim() : null;

                        const soldByElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(16) > b");
                        const soldBy =  soldByElement ? soldByElement.innerText.trim() : null;

                        const grossRentalElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(18) > b");
                        const grossRental =  grossRentalElement ? grossRentalElement.innerText.trim() : null;

                        const lastRentalAmountElement = document.querySelector("#report_7461900984040226668_catch > dl > dd:nth-child(20) > b");
                        const lastRentalAmount =  lastRentalAmountElement ? lastRentalAmountElement.innerText.trim() : null;


                        const ulElement = document.querySelector('#PropSaleHistory_cards');
                        let liElements;
                        let prevTransactions = [];

                        if (ulElement) {
                            liElements = ulElement.querySelectorAll('li'); 

                            for (let j=0; j<liElements.length; j++) {
                                const soldDateElement = liElements[j].querySelector("h5.margin-none");
                                const soldDate =  soldDateElement ? soldDateElement.innerText.trim() : null;

                                const soldByElement = liElements[j].querySelector("span.u-color-11-text");
                                const soldBy =  soldByElement ? soldByElement.innerText.trim() : null;

                                const soldPriceElement = liElements[j].querySelector("h4.margin-none > span");
                                const soldPrice =  soldPriceElement ? soldPriceElement.innerText.trim() : null;

                                const unitSizeElement = liElements[j].querySelector("p.u-color-11-text");
                                const unitSize =  unitSizeElement ? unitSizeElement.innerText.trim() : null;

                                prevTransactions.push({soldDate, soldBy, soldPrice, unitSize});
                            }
                        }

                        return {soldPrice, priceUnit, date, address, bedroom, category, unitSize, prevPrice, status, soldBy, grossRental, lastRentalAmount, prevTransactions};

                    });

                    console.log(content);
                    allDetails.push(content);

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

        // await writeToCSV(allDetails);

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        // await browser.close();
        console.log('Browser closed');
    }
}

async function writeToCSV(data) {
    const csvWriter = createCsvWriter({
        path: 'transaction-details.csv',
        header: [
            { id: 'soldPrice', title: 'Sold Price' },
            { id: 'priceUnit', title: 'Price Unit' },
            { id: 'date', title: 'Date' },
            { id: 'address', title: 'Address' },
            { id: 'bedroom', title: 'Bedroom' },
            { id: 'category', title: 'Category' },
            { id: 'unitSize', title: 'Unit Size' },
            { id: 'prevPrice', title: 'Previous Price' },
            { id: 'status', title: 'Status' },
            { id: 'soldBy', title: 'Sold By' },
            { id: 'grossRental', title: 'Gross Rental' },
            { id: 'lastRentalAmount', title: 'Last Rental Amount' },
        ]
    });

    await csvWriter.writeRecords(data);
    console.log('Data successfully written to CSV file');
}

const targetUrl = 'https://dxbinteract.com/dubai-house-prices/';

scrapeTransactionDetails(targetUrl)
  .then(results => {
    console.log(`Scraping completed. Extracted ${results?.length || 0} transaction details.`);
  })
  .catch(error => console.error('Scraping failed:', error));