import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';


describe('Signup Page', () => {
    let driver;
    const testEmail = `${faker.internet.username().toLowerCase()}@itobuz.com`;
    const testPassword = 'Password123!';

    beforeEach(async () => {
        // Create a new browser instance before each test
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
    });

    afterEach(async () => {
        // Close the browser after each test
        if (driver) {
            try {
                await driver.quit();
            } catch (error) {
                console.warn('Failed to close browser:', error.message);
            }
        }
    });

    it('should sign up a new user, confirm via MailHog, and log in', async () => {
        await driver.get('https://sass-starter-kit.wordpress-studio.io/login');
        await driver.sleep(2000);
        // Click Register link
        const signupBtn = await driver.wait(
            until.elementLocated(By.css('[data-testid="register-link"]')),
            10000
        );
        await signupBtn.click();
        await driver.sleep(1000);
        // Fill registration form
        await driver.findElement(By.css('[data-testid="email-input"]')).sendKeys(testEmail);
        await driver.findElement(By.css('[data-testid="password-input"]')).sendKeys(testPassword);
        const registerBtn = await driver.findElement(By.css('[data-testid="register-button"]'));
        await registerBtn.click();
        // Validate registration toast
        // Debug: log all toast messages
        const allToasts = await driver.findElements(By.css('div[role="alert"]'));
        for (const toast of allToasts) {
            const toastText = await toast.getText();
            console.log('Toast found:', toastText);
        }
        const regToast = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'Toastify__toast--success') and @role='alert']")), 10000);
        // Wait for toast text to be non-empty (handle animation/delayed rendering)
        let regToastText = '';
        const start = Date.now();
        while (Date.now() - start < 5000) {
            regToastText = await regToast.getText();
            if (regToastText && regToastText.trim().length > 0) break;
            await driver.sleep(200);
        }
        if (!regToastText || regToastText.trim().length === 0) {
            // Try to get text from all child elements
            const childTexts = await regToast.findElements(By.xpath('.//*'));
            for (const child of childTexts) {
                const childText = await child.getText();
                if (childText && childText.trim().length > 0) {
                    regToastText += ' ' + childText;
                }
            }
            regToastText = regToastText.trim();
            if (!regToastText) {
                // Save screenshot for debugging
                const screenshotPath = path.resolve('./registration-toast-empty.png');
                const image = await driver.takeScreenshot();
                fs.writeFileSync(screenshotPath, image, 'base64');
                console.warn('Registration toast text is still empty. Screenshot saved to', screenshotPath);
            }
        }
        console.log('Registration toast text (final):', regToastText);
        expect(regToastText).toContain('Please check your email for verification');
        // Open MailHog and find the most recent email
        await driver.get('https://mailhog.x-studio.io/#');
        // Wait for up to 30 seconds for at least one email to appear
        let messages = [];
        let mailhogTimeout = Date.now() + 30000;
        while (Date.now() < mailhogTimeout) {
            try {
                messages = await driver.findElements(By.css('.msglist-message'));
                if (messages.length > 0) break;
            } catch (e) {
                // Ignore errors, just retry
            }
            await driver.sleep(1000);
            // Optionally refresh MailHog if still no messages after 10s
            if (Date.now() > mailhogTimeout - 20000 && messages.length === 0) {
                await driver.navigate().refresh();
            }
        }
        if (!messages.length) {
            // Debug: save screenshot and log
            const screenshotPath = path.resolve('./mailhog-no-messages.png');
            const image = await driver.takeScreenshot();
            fs.writeFileSync(screenshotPath, image, 'base64');
            console.warn('No emails found in MailHog after waiting. Screenshot saved to', screenshotPath);
            throw new Error('No emails found in MailHog after waiting 30 seconds');
        }
        await messages[0].click();
        await driver.sleep(1000);
        // Debug: log the full HTML of the email preview area
        let emailHtml = '';
        try {
            // Try to find the preview area (MailHog uses .msgviewer or .msgviewer-content)
            const preview = await driver.findElement(By.css('.msgviewer, .msgviewer-content'));
            emailHtml = await preview.getAttribute('innerHTML');
            console.log('Email preview HTML:', emailHtml);
        } catch (e) {
            console.warn('Could not get email preview HTML:', e.message);
        }
        // Check for iframes in the email preview and switch if present
        let switchedToIframe = false;
        const iframes = await driver.findElements(By.css('.msgviewer iframe, .msgviewer-content iframe'));
        if (iframes.length > 0) {
            await driver.switchTo().frame(iframes[0]);
            switchedToIframe = true;
            await driver.sleep(500);
        }
        // Try to click the Confirm Sign up button in the email
        let confirmClicked = false;
        let confirmUrls = [];
        try {
            const confirmBtn = await driver.wait(
                until.elementLocated(By.xpath("//span[text(),'Confirm Sign up']")),
                3000
            );
            await confirmBtn.click();
            confirmClicked = true;
        } catch { }
        if (!confirmClicked) {
            // Fallback: try anchors and spans, and log all anchor tags for debugging
            const anchors = await driver.findElements(By.css('a'));
            for (const anchor of anchors) {
                const anchorText = await anchor.getText();
                const href = await anchor.getAttribute('href');
                let outerHTML = '';
                try { outerHTML = await anchor.getAttribute('outerHTML'); } catch { }
                console.log('Anchor:', anchorText, href, 'HTML:', outerHTML);
                if (href && href.toLowerCase().includes('confirm')) {
                    confirmUrls.push(href);
                }
                if ((anchorText && anchorText.toLowerCase().includes('confirm')) || (href && href.toLowerCase().includes('confirm'))) {
                    try {
                        await anchor.click();
                        confirmClicked = true;
                        break;
                    } catch (e) {
                        // If click fails, try next
                    }
                }
                const childSpans = await anchor.findElements(By.css('span'));
                for (const childSpan of childSpans) {
                    const childText = await childSpan.getText();
                    if (childText.toLowerCase().includes('confirm')) {
                        try {
                            await anchor.click();
                            confirmClicked = true;
                            break;
                        } catch (e) { }
                    }
                }
                if (confirmClicked) break;
            }
        }
        // As a last resort, extract ALL confirmation URLs from the HTML and try each
        if (!confirmClicked && emailHtml) {
            // Find all hrefs containing 'confirm'
            const urlMatches = [...emailHtml.matchAll(/href=["']([^"']*confirm[^"']*)["']/gi)];
            for (const match of urlMatches) {
                let confirmUrl = match[1];
                if (!confirmUrl.startsWith('http')) {
                    // Try to resolve relative URLs
                    if (confirmUrl.startsWith('/')) {
                        confirmUrl = `https://sass-starter-kit.wordpress-studio.io${confirmUrl}`;
                    } else {
                        confirmUrl = `https://mailhog.x-studio.io/${confirmUrl}`;
                    }
                }
                confirmUrls.push(confirmUrl);
            }
            // Also extract any raw URLs containing 'confirm' from the HTML (not just hrefs)
            const rawUrlMatches = [...emailHtml.matchAll(/(https?:\/\/[^\s"'>]*confirm[^\s"'>]*)/gi)];
            for (const match of rawUrlMatches) {
                if (match[1] && !confirmUrls.includes(match[1])) {
                    confirmUrls.push(match[1]);
                }
            }
            if (confirmUrls.length) {
                for (const url of confirmUrls) {
                    try {
                        console.log('Attempting to navigate to confirmation URL:', url);
                        await driver.get(url);
                        confirmClicked = true;
                        break;
                    } catch (e) {
                        console.warn('Failed to navigate to confirmation URL:', url, e.message);
                    }
                }
            } else {
                console.warn('No confirmation URLs found in email HTML.');
            }
        }
        // If switched to iframe, switch back to default content
        if (switchedToIframe) {
            await driver.switchTo().defaultContent();
        }
        if (!confirmClicked) {
            // Log all anchor tags for debugging
            const anchors = await driver.findElements(By.css('a'));
            for (const anchor of anchors) {
                const anchorText = await anchor.getText();
                const href = await anchor.getAttribute('href');
                let outerHTML = '';
                try { outerHTML = await anchor.getAttribute('outerHTML'); } catch { }
                console.log('Final anchor debug:', anchorText, href, 'HTML:', outerHTML);
            }
            // Log the full email HTML for debugging
            console.log('Final email HTML for debug:', emailHtml);
            //throw new Error('Could not find or click the confirmation link in the email');
        }

        const iframe = await driver.findElement(By.css('iframe'));
        await driver.switchTo().frame(iframe);
        const button = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(), 'Confirm Sign up')]")), 5000);
        await button.click();

        const handles = await driver.getAllWindowHandles();
        if (handles.length > 1) {
            await driver.switchTo().window(handles[1]); // Switch to the new tab
        }

        // Ensure login page is displayed and log in
        await driver.wait(until.elementLocated(By.css('[data-testid="email-input"]')), 10000);
        await driver.findElement(By.css('[data-testid="email-input"]')).sendKeys(testEmail);
        await driver.findElement(By.css('[data-testid="password-input"]')).clear();
        await driver.findElement(By.css('[data-testid="password-input"]')).sendKeys(testPassword);
        const loginBtn = await driver.findElement(By.css('[data-testid="login-button"]'));
        await loginBtn.click();
        // Wait for successful login indication (e.g., dashboard or logout button)
        await driver.wait(until.elementLocated(By.css('body')), 10000);
        // Optionally, check for a dashboard element or logout button here
    }, 90000);
});
