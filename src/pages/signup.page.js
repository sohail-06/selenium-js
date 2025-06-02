import { By, until } from 'selenium-webdriver';
import axios from 'axios';

export class SignUpPage {
    static url = 'https://sass-starter-kit.wordpress-studio.io/register';
    static mailhogApi = 'https://mailhog.x-studio.io/api/v2/messages';

    // Selectors
    static emailInput = By.css('[data-testid="email-input"]');
    static passwordInput = By.css('[data-testid="password-input"]');
    static registerButton = By.css('[data-testid="register-button"]');
    static errorMessage = By.css('.error-message');
    static successMessage = By.css('.mantine-Alert-message');

    static async open(driver) {
        await driver.get(this.url);
        await driver.wait(
            until.elementLocated(By.css('form')),
            10000,
            'Sign up form not found'
        );
    }

    static async signUp(driver, email, password) {
        // Fill email
        const emailField = await driver.wait(
            until.elementLocated(this.emailInput),
            10000,
            'Email input not found'
        );
        await emailField.clear();
        await emailField.sendKeys(email);

        // Fill password
        const passwordField = await driver.wait(
            until.elementLocated(this.passwordInput),
            10000,
            'Password input not found'
        );
        await passwordField.clear();
        await passwordField.sendKeys(password);

        // Click register button
        const registerBtn = await driver.wait(
            until.elementLocated(this.registerButton),
            10000,
            'Register button not found'
        );
        await driver.wait(
            until.elementIsVisible(registerBtn),
            5000,
            'Register button not visible'
        );
        await driver.executeScript("arguments[0].scrollIntoView(true);", registerBtn);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", registerBtn);
    }

    static async getConfirmationEmail(email, retryCount = 5, delayMs = 2000) {
        for (let i = 0; i < retryCount; i++) {
            console.log(`Attempt ${i + 1}: Fetching confirmation email...`);
            const response = await axios.get(`${this.mailhogApi}?limit=50`);
            
            const confirmationEmail = response.data.items.find(msg => 
                msg.Content.Headers.Subject?.[0] === 'Email Confirmation' && 
                msg.Content.Headers.To?.[0].includes(email)
            );

            if (!confirmationEmail) {
                console.log('Confirmation email not found, retrying...');
                await new Promise(res => setTimeout(res, delayMs));
                continue;
            }

            console.log('Found confirmation email');
            return confirmationEmail;
        }
        throw new Error(`Confirmation email not found after ${retryCount} attempts`);
    }

    static async getErrorMessage(driver) {
        try {
            const errorElement = await driver.wait(
                until.elementLocated(this.errorMessage),
                5000
            );
            return await errorElement.getText();
        } catch {
            return null;
        }
    }

    static async getSuccessMessage(driver) {
        try {
            const successElement = await driver.wait(
                until.elementLocated(this.successMessage),
                5000
            );
            return await successElement.getText();
        } catch {
            return null;
        }
    }
}