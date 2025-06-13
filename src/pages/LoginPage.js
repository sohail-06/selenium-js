import 'dotenv/config';
import { By, until } from 'selenium-webdriver';

export class LoginPage {
    static url = process.env.LOGIN_URL || 'https://sass-starter-kit.wordpress-studio.io/login';

    static usernameInput = By.css('input[name="email"]');
    static passwordInput = By.css('input[name="password"]');
    static loginButton = By.css('button[type="submit"]');
    static welcomeHeading = By.css('#home h2');

    static async open(driver) {
        await driver.get(this.url);
    }

    static async login(driver, username, password) {
        // Wait for and fill email input
        const emailInput = await driver.wait(
            until.elementLocated(By.css('input[name="email"]')),
            10000,
            'Email input not found'
        );
        await emailInput.clear();
        await emailInput.sendKeys(username);

        // Wait for and fill password input
        const passwordInput = await driver.wait(
            until.elementLocated(By.css('input[name="password"]')),
            10000,
            'Password input not found'
        );
        await passwordInput.clear();
        await passwordInput.sendKeys(password);

        // Find and click login button
        const loginButton = await driver.wait(
            until.elementLocated(By.css('button[type="submit"]')),
            10000,
            'Login button not found'
        );
        
        await driver.wait(
            until.elementIsVisible(loginButton),
            5000,
            'Login button not visible'
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", loginButton);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", loginButton);
    }

    static async isWelcomeHeadingDisplayed(driver) {
        try {
            await driver.wait(until.elementLocated(this.welcomeHeading), 10000);
            const heading = await driver.findElement(this.welcomeHeading);
            return await heading.isDisplayed();
        } catch {
            return false;
        }
    }

    static async getWelcomeHeadingText(driver) {
        const heading = await driver.findElement(this.welcomeHeading);
        return await heading.getText();
    }

    static async logout(driver) {
        // Click the avatar first if present
        try {
            const avatar = await driver.findElement(By.css('[title="User Avatar"]'));
            await avatar.click();
            await driver.sleep(3000); // Small wait for menu to open
        } catch {}
        // Then try to find and click the profile button by its label text, aria-label, or SVG icon
        // let profileBtn;
        // try {
        //     profileBtn = await driver.findElement(By.xpath("//button[.//div[contains(text(), 'Profile')]]"));
        // } catch {
        //     try {
        //         profileBtn = await driver.findElement(By.css('button[aria-label="Profile"], button[title="Profile"]'));
        //     } catch {
        //         try {
        //             profileBtn = await driver.findElement(By.xpath("//button[.//svg[contains(@viewBox, '0 0 512 512')]]"));
        //         } catch {
        //             throw new Error('Profile button not found. Please update the selector in LoginPage.logout.');
        //         }
        //     }
        // }
        // await profileBtn.click();
        // Then click the Logout button in the menu
        let logoutBtn;
        try {
            // Wait for the logout button to be attached to the DOM and visible, then re-query it right before clicking
            await driver.wait(
                until.elementLocated(By.xpath("//div[contains(@class, 'mantine-Menu-itemLabel') and (normalize-space(text())='Logout' or contains(translate(text(),'LOGOUT','logout'),'logout'))]")),
                5000
            );
            await driver.sleep(200); // Give the menu a moment to stabilize
            logoutBtn = await driver.findElement(By.xpath("//div[contains(@class, 'mantine-Menu-itemLabel') and (normalize-space(text())='Logout' or contains(translate(text(),'LOGOUT','logout'),'logout'))]"));
            await driver.wait(until.elementIsVisible(logoutBtn), 2000);
        } catch {
            try {
                // Try by role or button as a fallback
                await driver.wait(
                    until.elementLocated(By.xpath("//button[contains(.,'Logout')] | //div[contains(@role,'menuitem') and contains(.,'Logout')]")),
                    5000
                );
                await driver.sleep(200);
                logoutBtn = await driver.findElement(By.xpath("//button[contains(.,'Logout')] | //div[contains(@role,'menuitem') and contains(.,'Logout')]"));
                await driver.wait(until.elementIsVisible(logoutBtn), 2000);
            } catch {
                throw new Error('Logout button not found. Please update the selector in LoginPage.logout.');
            }
        }
        // Scroll into view and click to avoid stale reference
        await driver.executeScript('arguments[0].scrollIntoView(true);', logoutBtn);
        await driver.sleep(100);
        await logoutBtn.click();
        // Optionally, wait for login input to reappear
        await driver.wait(until.elementLocated(this.usernameInput), 10000);
    }

    static async isLoginInputDisplayed(driver) {
        try {
            const input = await driver.findElement(this.usernameInput);
            return await input.isDisplayed();
        } catch {
            return false;
        }
    }
}
