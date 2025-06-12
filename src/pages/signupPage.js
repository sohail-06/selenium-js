// SignupPage.js
import { By, until } from 'selenium-webdriver';
import fs from 'fs';
import path from 'path';

export class SignupPage {
    constructor(driver) {
        this.driver = driver;
    }

    async navigateToLogin() {
        await this.driver.get('https://sass-starter-kit.wordpress-studio.io/login');
        await this.driver.sleep(2000);
    }

    async clickRegisterLink() {
        const signupBtn = await this.driver.wait(
            until.elementLocated(By.css('[data-testid="register-link"]')),
            10000
        );
        await signupBtn.click();
        await this.driver.sleep(1000);
    }

    async fillRegistrationForm(email, password) {
        await this.driver.findElement(By.css('[data-testid="email-input"]')).sendKeys(email);
        await this.driver.findElement(By.css('[data-testid="password-input"]')).sendKeys(password);
    }

    async submitRegistration() {
        const registerBtn = await this.driver.findElement(By.css('[data-testid="register-button"]'));
        await registerBtn.click();
    }

    async getRegistrationToast() {
        const allToasts = await this.driver.findElements(By.css('div[role="alert"]'));
        for (const toast of allToasts) {
            const toastText = await toast.getText();
            console.log('Toast found:', toastText);
        }

        const regToast = await this.driver.wait(until.elementLocated(
            By.xpath("//div[contains(@class, 'Toastify__toast--success') and @role='alert']")
        ), 10000);

        let regToastText = '';
        const start = Date.now();
        while (Date.now() - start < 5000) {
            regToastText = await regToast.getText();
            if (regToastText && regToastText.trim().length > 0) break;
            await this.driver.sleep(200);
        }

        if (!regToastText || regToastText.trim().length === 0) {
            const childTexts = await regToast.findElements(By.xpath('.//*'));
            for (const child of childTexts) {
                const childText = await child.getText();
                if (childText && childText.trim().length > 0) {
                    regToastText += ' ' + childText;
                }
            }
            regToastText = regToastText.trim();
            if (!regToastText) {
                const screenshotPath = path.resolve('./registration-toast-empty.png');
                const image = await this.driver.takeScreenshot();
                fs.writeFileSync(screenshotPath, image, 'base64');
                console.warn('Registration toast text is still empty. Screenshot saved to', screenshotPath);
            }
        }

        console.log('Registration toast text (final):', regToastText);
        return regToastText;
    }

    async openMailhogAndFindEmail() {
        await this.driver.get('https://mailhog.x-studio.io/#');
        let messages = [];
        let mailhogTimeout = Date.now() + 30000;
        while (Date.now() < mailhogTimeout) {
            try {
                messages = await this.driver.findElements(By.css('.msglist-message'));
                if (messages.length > 0) break;
            } catch (e) {}
            await this.driver.sleep(1000);
            if (Date.now() > mailhogTimeout - 20000 && messages.length === 0) {
                await this.driver.navigate().refresh();
            }
        }
        if (!messages.length) {
            const screenshotPath = path.resolve('./mailhog-no-messages.png');
            const image = await this.driver.takeScreenshot();
            fs.writeFileSync(screenshotPath, image, 'base64');
            throw new Error('No emails found in MailHog after waiting 30 seconds');
        }

        await messages[0].click();
        await this.driver.sleep(1000);
    }

    async confirmEmailAndClick() {
        let emailHtml = '';
        let confirmClicked = false;
        let confirmUrls = [];
        let switchedToIframe = false;

        try {
            const preview = await this.driver.findElement(By.css('.msgviewer, .msgviewer-content'));
            emailHtml = await preview.getAttribute('innerHTML');
            console.log('Email preview HTML:', emailHtml);
        } catch {}

        const iframes = await this.driver.findElements(By.css('.msgviewer iframe, .msgviewer-content iframe'));
        if (iframes.length > 0) {
            await this.driver.switchTo().frame(iframes[0]);
            switchedToIframe = true;
            await this.driver.sleep(500);
        }

        try {
            const confirmBtn = await this.driver.wait(
                until.elementLocated(By.xpath("//span[text(),'Confirm Sign up']")),
                3000
            );
            await confirmBtn.click();
            confirmClicked = true;
        } catch {}

        if (!confirmClicked) {
            const anchors = await this.driver.findElements(By.css('a'));
            for (const anchor of anchors) {
                const anchorText = await anchor.getText();
                const href = await anchor.getAttribute('href');
                if (href && href.toLowerCase().includes('confirm')) {
                    confirmUrls.push(href);
                }
                if ((anchorText && anchorText.toLowerCase().includes('confirm')) || href?.toLowerCase().includes('confirm')) {
                    try {
                        await anchor.click();
                        confirmClicked = true;
                        break;
                    } catch {}
                }
            }
        }

        if (!confirmClicked && emailHtml) {
            const matches = [...emailHtml.matchAll(/href=["']([^"']*confirm[^"']*)["']/gi)];
            for (const match of matches) {
                let url = match[1];
                if (!url.startsWith('http')) {
                    url = url.startsWith('/') 
                        ? `https://sass-starter-kit.wordpress-studio.io${url}` 
                        : `https://mailhog.x-studio.io/${url}`;
                }
                confirmUrls.push(url);
            }
            const rawMatches = [...emailHtml.matchAll(/(https?:\/\/[^\s"'>]*confirm[^\s"'>]*)/gi)];
            for (const match of rawMatches) {
                if (match[1] && !confirmUrls.includes(match[1])) {
                    confirmUrls.push(match[1]);
                }
            }
            for (const url of confirmUrls) {
                try {
                    console.log('Attempting to navigate to confirmation URL:', url);
                    await this.driver.get(url);
                    confirmClicked = true;
                    break;
                } catch {}
            }
        }

        if (switchedToIframe) {
            await this.driver.switchTo().defaultContent();
        }

        return confirmClicked;
    }

    async confirmInIframe() {
        const iframe = await this.driver.findElement(By.css('iframe'));
        await this.driver.switchTo().frame(iframe);
        const button = await this.driver.wait(until.elementLocated(By.xpath("//span[contains(text(), 'Confirm Sign up')]")), 5000);
        await button.click();
        await this.driver.switchTo().defaultContent();
    }

    async login(email, password) {
        const handles = await this.driver.getAllWindowHandles();
        if (handles.length > 1) {
            await this.driver.switchTo().window(handles[1]);
        }

        await this.driver.wait(until.elementLocated(By.css('[data-testid="email-input"]')), 10000);
        await this.driver.findElement(By.css('[data-testid="email-input"]')).sendKeys(email);
        const passwordInput = await this.driver.findElement(By.css('[data-testid="password-input"]'));
        await passwordInput.clear();
        await passwordInput.sendKeys(password);
        const loginBtn = await this.driver.findElement(By.css('[data-testid="login-button"]'));
        await loginBtn.click();
        await this.driver.wait(until.elementLocated(By.css('body')), 10000);
    }
}
