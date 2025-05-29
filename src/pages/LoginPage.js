import 'dotenv/config';
import { By, until } from 'selenium-webdriver';

export class LoginPage {
    static url = process.env.LOGIN_URL || 'https://sass-starter-kit.wordpress-studio.io/login';

    static usernameInput = By.css('[data-testid="email-input"]');
    static passwordInput = By.css('[data-testid="password-input"]');
    static loginButton = By.css('[data-testid="login-button"]');
    static welcomeHeading = By.css('#home h2');

    static async open(driver) {
        await driver.get(this.url);
    }

    static async login(driver, username, password) {
        await driver.findElement(this.usernameInput).sendKeys(username);
        await driver.findElement(this.passwordInput).sendKeys(password);
        await driver.findElement(this.loginButton).click();
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
}
