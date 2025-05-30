import { By, until } from 'selenium-webdriver';
import { LoginPage } from './LoginPage.js';
import { config } from 'dotenv';

config();

export class WorkspacePage {
    // Centralized selectors for all elements used
    static locators = {
        avatarMenu: By.css('div.mantine-Avatar-root[aria-haspopup="menu"]'),
        profileButton: By.xpath('//button[.//div[text()="Profile"]]'),
        workspacesMenu: By.css('[data-testid="Workspace"]'),

        addWorkspaceButton: By.css('[data-testid="add-workspace"]'), // Updated to match application's data-testid
        workspaceNameInput: By.css('[data-testid="name"]'),
        createWorkspaceButton: By.css('[data-testid="create-workspace"]'),

        exposeButton: By.css('[data-testid="expose-button"]'),
        editButton: By.css('[data-testid="edit"]'),
        deleteButton: By.css('[data-testid="delete"]'),

        successCreateMsg: By.xpath(`//div[contains(text(),'Workspace created successfully')]`),
        successUpdateMsg: By.xpath(`//div[contains(text(),'Workspace updated successfully')]`),
        successDeleteMsg: By.xpath(`//div[contains(text(),'Workspace deleted successfully')]`),

        deleteConfirmButton: By.xpath('//*[@id="mantine-gnb8arv8r-body"]/div/button[2]'),
    };

    static async navigate(driver, username = process.env.TEST_USERNAME, password = process.env.TEST_PASSWORD) {
        try {
            // First ensure we're logged in
            await LoginPage.open(driver);
            await driver.wait(until.elementLocated(By.css('input')), 10000);
            await LoginPage.login(driver, username, password);
            
            // Wait for the page to load after login
            await driver.sleep(2000);

            // Click on the avatar menu with retry
            const avatar = await driver.wait(until.elementLocated(this.locators.avatarMenu), 10000);
            await driver.wait(until.elementIsVisible(avatar), 5000);
            await driver.executeScript("arguments[0].click();", avatar);

            // Click profile button with retry
            const profileBtn = await driver.wait(until.elementLocated(this.locators.profileButton), 10000);
            await driver.wait(until.elementIsVisible(profileBtn), 5000);
            await driver.executeScript("arguments[0].click();", profileBtn);
            
            await driver.sleep(1000);

            // Click workspaces menu with retry
            const workspaces = await driver.wait(until.elementLocated(this.locators.workspacesMenu), 10000);
            await driver.wait(until.elementIsVisible(workspaces), 5000);
            await driver.executeScript("arguments[0].click();", workspaces);
            
            // Wait for workspace page to load
            await driver.sleep(2000);

        } catch (error) {
            console.error('Error navigating to workspace page:', error);
            throw error;
        }
    }

    static async createWorkspace(driver, workspaceName) {
        try {
            // Wait for add workspace button and click with retry
            const addButton = await driver.wait(
                until.elementLocated(this.locators.addWorkspaceButton), 
                15000,
                'Add workspace button not found'
            );
            await driver.wait(until.elementIsVisible(addButton), 5000);
            await driver.executeScript("arguments[0].scrollIntoView(true);", addButton);
            await driver.sleep(1000);
            await driver.executeScript("arguments[0].click();", addButton);
            const addBtn = await driver.wait(until.elementLocated(this.locators.addWorkspaceButton), 10000);
            await addBtn.click();

            const nameInput = await driver.wait(until.elementLocated(this.locators.workspaceNameInput), 10000);
            await nameInput.sendKeys(workspaceName);

            const createBtn = await driver.wait(until.elementLocated(this.locators.createWorkspaceButton), 10000);
            await createBtn.click();

            return await driver.wait(until.elementLocated(this.locators.successCreateMsg), 10000);
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    }

    static async editWorkspace(driver, oldName, newName) {
        try {
            // Note: You might want to add logic here to locate the specific expose-button for the workspace `oldName`
            const exposeBtn = await driver.wait(until.elementLocated(this.locators.exposeButton), 10000);
            await exposeBtn.click();

            const editBtn = await driver.wait(until.elementLocated(this.locators.editButton), 10000);
            await editBtn.click();

            const nameInput = await driver.wait(until.elementLocated(this.locators.workspaceNameInput), 10000);
            await nameInput.clear();
            await nameInput.sendKeys(newName);

            const saveBtn = await driver.wait(until.elementLocated(this.locators.createWorkspaceButton), 10000);
            await saveBtn.click();

            return await driver.wait(until.elementLocated(this.locators.successUpdateMsg), 10000);
        } catch (error) {
            console.error('Error editing workspace:', error);
            throw error;
        }
    }

    static async deleteWorkspace(driver, workspaceName) {
        try {
            // Again, add logic to find exposeButton for specific workspaceName if needed
            const exposeBtn = await driver.wait(until.elementLocated(this.locators.exposeButton), 10000);
            await exposeBtn.click();

            const deleteBtn = await driver.findElement(this.locators.deleteButton);
            await deleteBtn.click();

            const confirmBtn = await driver.wait(until.elementLocated(this.locators.deleteConfirmButton), 10000);
            await confirmBtn.click();

            return await driver.wait(until.elementLocated(this.locators.successDeleteMsg), 10000);
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw error;
        }
    }
}
