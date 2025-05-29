import { By, until } from 'selenium-webdriver';
import axios from 'axios';
import { updatePassword } from '../utils/updateEnv.js';

export default class ForgotPasswordPage {
    constructor(driver) {
        this.driver = driver;
        this.selectors = {
            forgotPasswordLink: '[href="/forget-password"]',
            emailInput: 'input[name="email"]',
            requestButton: "//button[.//span[contains(text(), 'Request password change')]]",
            successMessage: '//*[contains(text(), "Password reset link sent to your email")]',
            passwordInput: 'input[name="password"]',
            confirmPasswordInput: 'input[name="confirmPassword"]',
            changePasswordButton: '//span[contains(text(), "Change Password")]',
            forgotPasswordForm: 'form',
            loginEmailInput: 'input[name="email"]',
            forgotPasswordLinkWithEmail: '//a[contains(@href, "/forget-password?email=")]',
        };
        this.mailhogApi = 'https://mailhog.x-studio.io/api/v2/messages';
    }

    async navigateToLogin() {
        await this.driver.get('https://sass-starter-kit.wordpress-studio.io/login');
        await this.driver.sleep(2000); // Wait for page load

        // Wait for login page to be fully loaded
        await this.driver.wait(
            until.elementLocated(By.css('form')),
            10000,
            'Login form not found'
        );
    }

    async clickForgotPassword() {
        // Wait for forgot password link with retry
        const link = await this.driver.wait(
            until.elementLocated(By.css(this.selectors.forgotPasswordLink)),
            10000,
            'Forgot password link not found'
        );

        await this.driver.wait(
            until.elementIsVisible(link),
            5000,
            'Forgot password link not visible'
        );

        await this.driver.executeScript("arguments[0].scrollIntoView(true);", link);
        await this.driver.sleep(500);
        await link.click();
    }

    async submitEmail(email) {
        // Wait for form to be loaded
        await this.driver.wait(
            until.elementLocated(By.css(this.selectors.forgotPasswordForm)),
            10000,
            'Forgot password form not found'
        );
        
        // Enter email with wait
        const emailInput = await this.driver.wait(
            until.elementLocated(By.css(this.selectors.emailInput)),
            10000,
            'Email input not found'
        );
        await emailInput.clear();
        await emailInput.sendKeys(email);
        await this.driver.sleep(500);

        // Find and click request button with retry
        const requestButton = await this.driver.wait(
            until.elementLocated(By.xpath(this.selectors.requestButton)),
            10000,
            'Request button not found'
        );
        
        await this.driver.wait(
            until.elementIsVisible(requestButton),
            5000,
            'Request button not visible'
        );

        await this.driver.executeScript("arguments[0].scrollIntoView(true);", requestButton);
        await this.driver.sleep(500);
        await requestButton.click();
    }

    async waitForSuccessMessage() {
        await this.driver.wait(
            until.elementLocated(By.xpath(this.selectors.successMessage)),
            10000,
            'Success message not found'
        );
    }

    async getResetTokenViaMailhog(email, retryCount = 5, delayMs = 2000) {
        for (let i = 0; i < retryCount; i++) {
            try {
                console.log(`Attempt ${i + 1}: Fetching reset email...`);
                const response = await axios.get(`${this.mailhogApi}?limit=50`);
                
                const targetEmail = response.data.items.find(msg => 
                    msg.Content.Headers.Subject?.[0] === 'Password Reset Request' && 
                    msg.Content.Headers.To?.[0].includes(email)
                );

                if (!targetEmail) {
                    console.log('Reset email not found, retrying...');
                    await new Promise(res => setTimeout(res, delayMs));
                    continue;
                }

                const body = targetEmail.Content.Body;
                const tokenPattern = /token=([^"&\s]+)/g;
                const matches = [...body.matchAll(tokenPattern)];
                
                if (matches.length > 0) {
                    const token = matches[matches.length - 1][1];
                    console.log(`Found token: ${token}`);
                    return token;
                }

                const cleanBody = body
                    .replace(/=\r\n/g, '')
                    .replace(/&#x3D;/g, '=')
                    .replace(/&amp;/g, '&');
            
                const cleanMatches = [...cleanBody.matchAll(tokenPattern)];
                if (cleanMatches.length > 0) {
                    const token = cleanMatches[cleanMatches.length - 1][1];
                    console.log(`Found token from cleaned body: ${token}`);
                    return token;
                }

                console.log('Token not found in email body, retrying...');
                await new Promise(res => setTimeout(res, delayMs));

            } catch (error) {
                console.error(`Error in attempt ${i + 1}: ${error.message}`);
                if (i === retryCount - 1) throw error;
                await new Promise(res => setTimeout(res, delayMs));
            }
        }
        throw new Error('Failed to extract reset token from email');
    }

    async navigateToResetPassword(token) {
        const resetUrl = `https://sass-starter-kit.wordpress-studio.io/password-reset?token=${token}`;
        console.log('Navigating to reset URL:', resetUrl);
        await this.driver.get(resetUrl);
        await this.driver.sleep(2000); // Wait for page load
    }

    async resetPassword(newPassword) {
        const passwordInput = await this.driver.findElement(By.css(this.selectors.passwordInput));
        const confirmPasswordInput = await this.driver.findElement(By.css(this.selectors.confirmPasswordInput));

        await passwordInput.sendKeys(newPassword);
        await confirmPasswordInput.sendKeys(newPassword);

        const changeBtn = await this.driver.findElement(By.xpath(this.selectors.changePasswordButton));
        await changeBtn.click();

        // Update password in .env file
        await updatePassword(newPassword);
    }

    async enterEmailOnLoginPage(email) {
        const emailInput = await this.driver.wait(
            until.elementLocated(By.css(this.selectors.loginEmailInput)),
            10000,
            'Login email input not found'
        );
        await emailInput.clear();
        await emailInput.sendKeys(email);
        await this.driver.sleep(500);

        // Click forgot password link which should now include email
        const forgotLink = await this.driver.wait(
            until.elementLocated(By.xpath(this.selectors.forgotPasswordLinkWithEmail)),
            10000,
            'Forgot password link with email not found'
        );
        await forgotLink.click();
        
        // Wait for redirect
        await this.driver.wait(
            until.urlContains('forget-password?email='),
            10000,
            'Not redirected to forgot password page with email'
        );
    }
}