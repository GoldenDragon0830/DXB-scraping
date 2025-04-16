import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { PrismaClient } from "@prisma/client";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import axios from 'axios';
import cron from 'node-cron';

const prisma = new PrismaClient();

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/transaction", routes.transaction);

puppeteer.use(StealthPlugin());

async function waitForTimeout(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

async function scrapeTransactionDetails(url) {

    // const proxyServer = '137.59.4.211:6080';

    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        args: [
            '--start-maximized',
            // `--proxy-server=${proxyServer}`
        ]
    });

    try {
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.180 Safari/537.36');

        await page.setExtraHTTPHeaders({
            'accept-language': 'en-US,en;q=0.9',
        });

        // await page.authenticate({
        //     username: 'PICpic123',
        //     password: 'upwork123'
        // });

        await page.goto(url, {
            waitUntil: 'load',
            timeout: 60000,
        });

        const districts = [
            "Jumeirah Lakes Towers"
            // "Downtown Dubai",
            // "Business Bay",
            // "Dubai Marina, Marsa Dubai",
            // "Bluewaters Island",
            // "Jumeirah Village Circle (JVC) ",
            // "Sobha Hartland 2, Bukadra",
            // "Sobha One, Ras Al Khor Industrial First",
            // "Dubai Creek Harbour",
            // "Emaar Beachfront (all buildings)",
            // "Dubai Land, Wadi Al Safa 4",
            // "Arjan, Al Barshaa South Third",
            // "Dubai South Residential District, Madinat Al Mataar",
        ]

        let dlg_index = 0;

        let id = -10000;


        for(let k=0; k<districts.length; k++) {
            console.log(districts[k]);
            
            let allDetails = [];

            await waitForTimeout(3000);
        
            await page.waitForSelector("#LocationsStack > a", {timeout: 30000});
            await page.click('#LocationsStack > a');
    
            await page.waitForSelector("#SearchInput", {timeout: 30000});
            await page.type('#SearchInput', districts[k]);
            
            await page.waitForSelector('#AreasList > article:first-of-type', { timeout: 30000 });
            await page.click('#AreasList > article:first-of-type');
    
            await waitForTimeout(2000);
            
            await page.waitForSelector('#R7990151324798006877 > div > ul > li:nth-child(2)', { timeout: 30000 });
            await page.click('#R7990151324798006877 > div > ul > li:nth-child(7)');
    
            await waitForTimeout(3000);
    
            let detailCount = 0;
            let pageNum = 0;
            let index = 0;
    
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
    
                // console.log('Row count => ', detailButtons.length);

                console.log(detailButtons.length);
        
                if (detailButtons.length > 0) {
                    detailCount += detailButtons.length;
                    for(let i=0; i<detailButtons.length ; i++) {
                        await detailButtons[i].click();
                        await waitForTimeout(3000);
                        index++;
                        dlg_index++;
                        console.log(index);
    
                        await page.waitForSelector(`#apex_dialog_${dlg_index}`, { visible: true });
                        let frameHandle = await page.waitForSelector(`#apex_dialog_${dlg_index} > iframe`, {timeout: 3000});
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
                            let prevSales = [];
    
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
    
                                    prevSales.push({soldDate, soldBy, soldPrice, unitSize});
                                }
                            }
    
                            return {soldPrice, priceUnit, date, address, bedroom, category, unitSize, prevPrice, status, soldBy, grossRental, lastRentalAmount, prevSales};
    
                        });
    
                        // console.log(content);
                        // allDetails.push({...content, district: districts[k]});

                        id = id-1;

                        let transaction = {
                            platform: "dxb",
                            id: id,
                            ownerID: id,
                            userExternalID: id.toString(),
                            sourceID: id,
                            state: content.status,
                            purpose: "for-sale",
                            price: Number(content.prevTransactions[0].soldPrice.split(' ')[1].replace(/,/g, '')),
                            externalID: id.toString(),
                            location: ("UAE, Dubai, " + content.address).split(", ").map( name=> ({"name": name}) ),
                            dxb_category: content.category,
                            dxb_bedroom: content.bedroom,
                            dxb_unitsize: Number(content.unitSize.split(' ')[0].replace(/,/g, '')),
                            dxb_transaction: content.prevTransactions,
                            type: "transaction",
                            createdAt: moment(Date.now()).toDate(),
                            updatedAt: moment(Date.now()).toDate(),
                            reactivatedAt: moment(Date.now()).toDate()
                        }

                        allDetails.push(transaction);
    
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

            await prisma.property.createMany({
                data: allDetails
            });
    
            // await writeToCSV(allDetails);
        }

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

app.listen(process.env.PORT, () =>
    console.log(`Scraping app listening on port ${process.env.PORT}!`)
);
  