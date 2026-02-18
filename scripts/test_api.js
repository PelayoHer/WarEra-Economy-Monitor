const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9pZCI6IjY4MTNiNzcwZWZlY2RmOWJhYjE5NmJhYSJ9LCJpYXQiOjE3NzAyMDQ2NjMsImV4cCI6MTc3Mjc5NjY2M30.eUPUFX7DFrz7Xr7zNDbzdafss-FZuJdzgq6Ib0YUxCg';
const fingerprint = '4578fb52c7ad5811b524b1564f19e480';
const username = 'PelayoHer';

const procedures = [
    'worker.getWorkplaces',
    'worker.getWorkers',
    'company.getCompaniesByUser',
    'company.getByUser',
    'user.getProfile',
    'user.getUser',
    'user.getUserByUsername',
    'user.getPublicProfile',
    'user.search',
    'public.getUser',
    'auth.getProfile',
    'user.find',
    'user.findByUsername'
];

async function tryProcedure(procName, input) {
    return new Promise((resolve) => {
        const encodedInput = encodeURIComponent(JSON.stringify({ "0": input }));
        const url = `https://api2.warera.io/trpc/${procName}?batch=1&input=${encodedInput}`;

        const options = {
            headers: {
                'authorization': `Bearer ${token}`,
                'x-fingerprint': fingerprint,
                'content-type': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[SUCCESS] ${procName}:`, data.substring(0, 500));
                } else {
                    console.log(`[FAIL] ${procName}: ${res.statusCode}`);
                    if (res.statusCode === 500 || res.statusCode === 400) {
                        try {
                            const json = JSON.parse(data);
                            console.log('Error details:', JSON.stringify(json.error?.data || json, null, 2));
                        } catch (e) {
                            console.log('Raw error:', data.substring(0, 200));
                        }
                    }
                }
                resolve(true);
            });
        }).on('error', (e) => {
            console.error(`[ERROR] ${procName}:`, e.message);
            resolve(false);
        });
    });
}

(async () => {
    console.log(`Testing procedures for user "${username}"...`);

    // Iterate all procedures with standard username input
    for (const proc of procedures) {
        await tryProcedure(proc, { username: username });
    }

    // Try special inputs
    console.log('Trying special inputs...');
    await tryProcedure('user.search', { query: username });
    await tryProcedure('public.searchUser', { query: username });
})();
