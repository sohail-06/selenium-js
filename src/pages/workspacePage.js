import { By, until } from 'selenium-webdriver';
import { LoginPage } from './loginPage.js';
import { config } from 'dotenv';

config();

export class WorkspacePage {
    // Centralized selectors for all elements used
    static locators = {
        avatarMenu: By.css('div.mantine-Avatar-root[aria-haspopup="menu"]'),
        profileButton: By.xpath('//button[.//div[text()="Profile"]]'),
        workspacesMenu: By.css('[data-testid="Workspace"]'),

        // Grid and search
        searchInput: By.css('[data-testid="search-role"]'),
        workspaceGrid: By.css('.MuiDataGrid-root'),
        workspaceRow: (name) => By.xpath(`//div[contains(@class,'MuiDataGrid-row')]//div[contains(@class,'MuiDataGrid-cell')][normalize-space()='${name}']`),

        addWorkspaceButton: By.css('[data-testid="add-workspace"]'),
        workspaceNameInput: By.css('[data-testid="name"]'),
        createWorkspaceButton: By.css('[data-testid="create-workspace"]'),

        // Row actions
        exposeButton: (name) => By.xpath(`//div[contains(@class,'MuiDataGrid-row')][.//div[contains(@class,'MuiDataGrid-cell')][normalize-space()='${name}']]//button[@data-testid="expose-button"]`),
        editButton: By.css('[data-testid="edit"]'),
        deleteButton: By.css('[data-testid="delete"]'),
        deleteConfirmButton: By.xpath("//button//span[contains(@class, 'mantine-Button-label') and text()='Delete']"),

        successCreateMsg: By.xpath(`//div[contains(text(),'Workspace created successfully')]`),
        successUpdateMsg: By.xpath(`//div[contains(text(),'Workspace updated successfully')]`),
        successDeleteMsg: By.xpath(`//div[contains(text(),'Workspace deleted successfully')]`)
    };

    // Helper method to wait for grid loading
    static async waitForGridUpdate(driver) {
        // First wait for grid to be present
        const grid = await driver.wait(
            until.elementLocated(this.locators.workspaceGrid),
            10000,
            'Grid element not found within timeout'
        );

        // Wait for grid to be visible
        await driver.wait(
            until.elementIsVisible(grid),
            5000,
            'Grid element not visible after being found'
        );

        // Wait for any loading states to complete
        await driver.sleep(1500);

        // Scroll grid into view to ensure it's properly rendered
        await driver.executeScript("arguments[0].scrollIntoView(true);", grid);
        
        // Additional small wait for any post-scroll rendering
        await driver.sleep(500);
    }

    // Helper to find workspace row with retry
    static async findWorkspaceRow(driver, workspaceName, timeout = 10000) {
        const startTime = Date.now();
        let lastError;
        let attempts = 0;
        const maxAttempts = 5;

        while (Date.now() - startTime < timeout && attempts < maxAttempts) {
            attempts++;
            try {
                // Wait for grid to be stable first
                await this.waitForGridUpdate(driver);

                // Try to find the row
                const row = await driver.wait(
                    until.elementLocated(this.locators.workspaceRow(workspaceName)),
                    2000
                );

                // Verify the row is visible
                await driver.wait(
                    until.elementIsVisible(row),
                    2000,
                    `Workspace row "${workspaceName}" found but not visible`
                );

                // If we get here, we found the row successfully
                return row;
            } catch (error) {
                lastError = error;
                console.log(`Attempt ${attempts} failed to find workspace "${workspaceName}": ${error.message}`);
                
                // Try refreshing the grid view by interacting with search
                try {
                    const searchInput = await driver.findElement(this.locators.searchInput);
                    await searchInput.clear();
                    await searchInput.sendKeys(workspaceName);
                    await driver.sleep(1000);
                    await searchInput.clear();
                    await driver.sleep(500);
                } catch (searchError) {
                    console.log('Failed to interact with search:', searchError.message);
                }
            }
        }
        
        throw new Error(
            `Could not find workspace row "${workspaceName}" after ${attempts} attempts and ${Date.now() - startTime}ms.\n` +
            `Last error: ${lastError?.message}\n` +
            'Please verify the workspace name is correct and the grid has loaded properly.'
        );
    }

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
            await this.waitForGridUpdate(driver);

        } catch (error) {
            console.error('Error navigating to workspace page:', error);
            throw error;
        }
    }

    static async createWorkspace(driver, workspaceName) {
        try {
            await this.waitForGridUpdate(driver);

            // Click add workspace button
            const addButton = await driver.wait(
                until.elementLocated(this.locators.addWorkspaceButton), 
                15000,
                'Add workspace button not found'
            );
            await driver.wait(until.elementIsVisible(addButton), 5000);
            await driver.executeScript("arguments[0].scrollIntoView(true);", addButton);
            await driver.sleep(1000);
            await driver.executeScript("arguments[0].click();", addButton);

            // Fill in name and create
            const nameInput = await driver.wait(until.elementLocated(this.locators.workspaceNameInput), 10000);
            await nameInput.sendKeys(workspaceName);

            const createBtn = await driver.wait(until.elementLocated(this.locators.createWorkspaceButton), 10000);
            await createBtn.click();

            // Wait for success message
            return await driver.wait(until.elementLocated(this.locators.successCreateMsg), 10000);
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    }

    static async editWorkspace(driver, oldName, newName) {
        try {
            await this.waitForGridUpdate(driver);

            // Find the specific workspace row first
            await this.findWorkspaceRow(driver, oldName);

            // Click expose button for the specific row
            const exposeBtn = await driver.wait(
                until.elementLocated(this.locators.exposeButton(oldName)), 
                10000
            );
            await exposeBtn.click();

            // Click edit and update name
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
            await this.waitForGridUpdate(driver);

            // Find the specific workspace row first
            await this.findWorkspaceRow(driver, workspaceName);

            // Click expose button for the specific row
            const exposeBtn = await driver.wait(
                until.elementLocated(this.locators.exposeButton(workspaceName)), 
                10000
            );
            await exposeBtn.click();

            // Click delete and confirm
            const deleteBtn = await driver.wait(until.elementLocated(this.locators.deleteButton), 10000);
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
