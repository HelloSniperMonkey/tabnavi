interface BreachResult {
    email: string;
    isBreached: boolean;
    timestamp: string;
}

async function checkBreachForEmail(email: string): Promise<boolean> {
    const api_url = `https://api.xposedornot.com/v1/breach-analytics?email=${email}`;
    
    try {
        const response = await fetch(api_url, {
            method: 'GET',
        });

        if (response.ok) {
            const result = await response.json();
            return "BreachMetrics" in result;
        }
        
        console.error("Error:", response.status, response.statusText);
        return false;
    } catch (error) {
        console.error("Error checking breach for email:", email, error);
        return false;
    }
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkDataBreaches(passwords: any[]): Promise<BreachResult[]> {
    const results: BreachResult[] = [];
    const timestamp = new Date().toISOString();
    
    for (const passwordData of passwords) {
        try {
            const isBreached = await checkBreachForEmail(passwordData.username);
            
            results.push({
                email: passwordData.username,
                isBreached,
                timestamp
            });
            
            // Rate limiting: Wait 1 second before processing the next email
            if (passwords.indexOf(passwordData) < passwords.length - 1) {
                await sleep(1000);
            }
        } catch (error) {
            console.error(`Error processing email ${passwordData.username}:`, error);
            results.push({
                email: passwordData.username,
                isBreached: false,
                timestamp
            });
        }
    }
    
    return results;
}

export { checkDataBreaches, type BreachResult };