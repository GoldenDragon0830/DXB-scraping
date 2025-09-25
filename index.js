import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
// import { PrismaClient } from "@prisma/client";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import axios from 'axios';
import cron from 'node-cron';
import moment from "moment";

// const prisma = new PrismaClient();

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

const targetUrl = 'https://dxbinteract.com/dubai-house-prices/';

app.post('/api/scrape', async (req, res) => {
    try {
        const { property_id, project_name, building_name } = req.body;

        const results = await scrapeTransactionDetails(targetUrl, property_id, project_name, building_name);

        res.json({ 
            success: true, 
            message: 'Scraping completed successfully',
            data: results 
        });
    } catch (error) {
        console.error('Scraping API error:', error);
        res.status(500).json({ 
            error: 'Scraping failed', 
            message: error.message 
        });
    }
});

async function scrapeTransactionDetails(url, property_id, project_name, building_name) {
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

        await page.goto(url, {
            waitUntil: 'load',
            timeout: 60000,
        });

        await waitForTimeout(3000);

        await page.waitForSelector("li:nth-child(2) > a.t-Button--navBar", {timeout: 30000});
        await page.click('li:nth-child(2) > a.t-Button--navBar');

        await waitForTimeout(3000);

        let frameHandle = await page.waitForSelector(`#apex_dialog_1 > iframe`, {timeout: 3000});
        let frame = await frameHandle.contentFrame();

        await frame.waitForSelector("#P1001_LOGIN_EMAIL", {timeout: 30000});
        await frame.type('#P1001_LOGIN_EMAIL', "ben@sport-legacy.com");

        await frame.waitForSelector("#P1001_LOGIN_PASSWORD", {timeout: 30000});
        await frame.type('#P1001_LOGIN_PASSWORD', "dxbinteract2623!X");

        await frame.waitForSelector("#B5785800721449667599", {timeout: 30000});
        await frame.click('#B5785800721449667599');


        await waitForTimeout(3000);
    
        await page.waitForSelector("#LocationsStack > a", {timeout: 30000});
        await page.click('#LocationsStack > a');

        await page.waitForSelector("#SearchInput", {timeout: 30000});
        await page.type('#SearchInput', building_name);

        // Wait for search results to appear
        await page.waitForSelector("#AreasList", {timeout: 30000});
        
        // Wait a bit for results to fully load
        await waitForTimeout(1000);

        // Get the first item's strong text
        const is_correct_building = await page.evaluate((building_name) => {
            const areasList = document.querySelector('#AreasList');
            if (!areasList) return false;
            
            const firstArticle = areasList.querySelector('article:first-child');
            if (!firstArticle) return false;

            const spanElement = firstArticle.querySelector('span');

            const spanTextList = spanElement.textContent.trim().split(', ');
            
            return spanElement ? spanTextList.indexOf(building_name.trim()) >= 0 : false;
        }, building_name);
        
        if(is_correct_building) {
            // Click on the first item
            await page.click('#AreasList article:first-child');

            await waitForTimeout(7000);

            await page.waitForSelector("#report_7995429268703774766_catch", { timeout: 30000 });
            
            const prop_result = await page.evaluate(() => {

                const median_price_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(1) > span > span.t-BadgeList-value > div > span:nth-child(2)");
                const median_price = median_price_element ? median_price_element.innerText.trim() : null;

                const median_price_percent_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(1) > span > span.t-BadgeList-value > div > span:nth-child(3) > span");
                const median_price_percent = median_price_percent_element ? median_price_percent_element.innerText.trim() : null;
                
                const median_price_sqft_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(2) > span > span.t-BadgeList-value > div > span:nth-child(2)");
                const median_price_sqft = median_price_sqft_element ? median_price_sqft_element.innerText.trim() : null;
                
                const median_price_sqft_percent_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(2) > span > span.t-BadgeList-value > div > span:nth-child(3) > span");
                const median_price_sqft_percent = median_price_sqft_percent_element ? median_price_sqft_percent_element.innerText.trim() : null;
                
                const transactions_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(3) > span > span.t-BadgeList-value > div > span:nth-child(2)");
                const transactions = transactions_element ? transactions_element.innerText.trim() : null;
                
                const transactions_percent_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(3) > span > span.t-BadgeList-value > div > span:nth-child(3) > span");
                const transactions_percent = transactions_percent_element ? transactions_percent_element.innerText.trim() : null;
                
                const rental_yield_element = document.querySelector("#report_7995429268703774766_catch > ul > li:nth-child(4) > span > span.t-BadgeList-value > div > span.value");
                const rental_yield = rental_yield_element ? rental_yield_element.innerText.trim() : null;

                return {median_price, median_price_percent, median_price_sqft, median_price_sqft_percent, transactions, transactions_percent, rental_yield};
            });

            console.log(prop_result)
            
            return prop_result;
        }

        await page.evaluate(() => {
            document.querySelector('#SearchInput').value = '';
        });
        
        await page.type('#SearchInput', project_name);

         // Wait for search results to appear
        await page.waitForSelector("#AreasList", {timeout: 30000});
        
        // Wait a bit for results to fully load
        await waitForTimeout(1000);

        const is_correct_project = await page.evaluate((project_name) => {
            const areasList = document.querySelector('#AreasList');
            if (!areasList) return false;
            
            const firstArticle = areasList.querySelector('article:first-child');
            if (!firstArticle) return false;

            const spanElement = firstArticle.querySelector('span');

            const spanTextList = spanElement.textContent.trim().split(', ');
            
            return spanElement ? spanTextList.indexOf(project_name.trim()) >= 0 : false;
        }, project_name);

        if(is_correct_project) {
            // Click on the first item
            await page.click('#AreasList article:first-child');
            return;
        }

        return {};

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        // await browser.close();
        console.log('Browser closed');
    }
}

app.listen(process.env.PORT || 5001, () =>
    console.log(`Scraping app listening on port ${process.env.PORT || 5001}!`)
);
