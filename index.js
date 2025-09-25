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
        const is_correct_building = await page.evaluate(() => {
            const areasList = document.querySelector('#AreasList');
            if (!areasList) return false;
            
            const firstArticle = areasList.querySelector('article:first-child');
            if (!firstArticle) return false;
            
            const strongElement = firstArticle.querySelector('strong');
            return strongElement ? strongElement.textContent.trim() == building_name : false;
        });
        
        console.log('Is Correct Building', is_correct_building);
        
        // Click on the first item
        // await page.click('#AreasList article:first-child');

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        // await browser.close();
        console.log('Browser closed');
    }
}

app.listen(process.env.PORT, () =>
    console.log(`Scraping app listening on port ${process.env.PORT}!`)
);
  
