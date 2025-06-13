import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { WorkspacePage } from '../pages/workspacePage.js';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

config();

describe('Workspace Management Tests', () => {
    let driver;
    const TEST_WORKSPACE_NAME = `Test-${faker.string.alphanumeric(6)}`;
    const UPDATED_WORKSPACE_NAME = `Test-${faker.string.alphanumeric(6)}`;

    beforeAll(async () => {
        const options = new chrome.Options().addArguments(
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    afterAll(async () => {
        await driver?.quit();
    });

    const takeScreenshot = async (filename) => {
        const screenshot = await driver.takeScreenshot();
        const dir = path.resolve('./screenshots');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(path.join(dir, filename), screenshot, 'base64');
    };

    test('should create and display a new workspace', async () => {
        try {
            await WorkspacePage.navigate(driver);
            const successMessage = await WorkspacePage.createWorkspace(driver, TEST_WORKSPACE_NAME);

            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            const workspace = await WorkspacePage.findWorkspaceRow(driver, TEST_WORKSPACE_NAME);
            expect((await workspace.getText()).trim()).toBe(TEST_WORKSPACE_NAME);
        } catch (error) {
            await takeScreenshot('workspace-creation-error.png');
            throw error;
        }
    }, 30000);

    test('should edit the workspace name successfully', async () => {
        try {
            const successMessage = await WorkspacePage.editWorkspace(driver, TEST_WORKSPACE_NAME, UPDATED_WORKSPACE_NAME);

            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            const workspace = await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME);
            expect((await workspace.getText()).trim()).toBe(UPDATED_WORKSPACE_NAME);
        } catch (error) {
            await takeScreenshot('workspace-edit-error.png');
            throw error;
        }
    }, 30000);

    test('should delete the workspace and confirm deletion', async () => {
        try {
            const workspace = await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME);
            expect((await workspace.getText()).trim()).toBe(UPDATED_WORKSPACE_NAME);

            const successMessage = await WorkspacePage.deleteWorkspace(driver, UPDATED_WORKSPACE_NAME);
            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            await driver.sleep(2000); // Allow grid to update

            try {
                await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME, 5000);
                throw new Error('Workspace still exists after deletion');
            } catch (error) {
                expect(error.message).toContain('Could not find workspace row');
            }

            const logoutLink = await driver.wait(
                until.elementLocated(By.xpath("//a[@href='/logout']")),
                10000
            );
            await logoutLink.click();
            await driver.sleep(3000);
        } catch (error) {
            await takeScreenshot('workspace-delete-error.png');
            throw error;
        }
    }, 30000);
});
